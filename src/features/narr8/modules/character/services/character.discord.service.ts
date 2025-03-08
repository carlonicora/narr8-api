import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ChatInputCommandInteraction, Client, Guild, GuildMember } from "discord.js";
import { DISCORD_CLIENT } from "src/common/providers/discord.client.provider";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";
import { CharacterRepository } from "src/features/narr8/modules/character/repositories/character.repository";
import { CharacterDiscordSerialiser } from "src/features/narr8/modules/character/serialisers/character.discord.serialiser";
import { User } from "src/features/narr8/modules/user/entities/user.entity";
import { UserRepository } from "src/features/narr8/modules/user/repositories/user.repository";

enum subCommand {
  Create = "create",
  Display = "display",
  Avatar = "avatar",
  Name = "name",
}

// List of attribute keys – note they are in lowercase to match the repository patch keys.
const attributeKeys: string[] = [
  "agility",
  "awareness",
  "charisma",
  "empathy",
  "intellect",
  "occult",
  "strength",
  "willpower",
];

@Injectable()
export class CharacterDiscordService {
  private readonly logger = new Logger(CharacterDiscordService.name);

  constructor(
    @Inject(DISCORD_CLIENT) private readonly client: Client,
    private readonly characterRepository: CharacterRepository,
    private readonly characterDiscordSerialiser: CharacterDiscordSerialiser,
    private readonly errorDiscordSerialiser: ErrorDiscordSerialiser,
    private readonly userRepository: UserRepository,
  ) {}

  async handleCharacterCommand(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "Command used outside of a guild." })],
      });
      this.logger.error("Command used outside of a guild.");
      return;
    }

    const guildUser = interaction.user;
    if (!guildUser) {
      await interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "Command used by a non-guild user." })],
      });
      this.logger.error("Command used by a non-guild user.");
      return;
    }

    let user: User = await this.userRepository.findUserByDiscord({ discord: guildUser.id });
    if (!user) {
      user = await this.userRepository.create({
        id: randomUUID(),
        discord: guildUser.id,
        name: guildUser.username,
      });
    }

    // Get subcommand
    const inputSubCommand = interaction.options.getSubcommand();
    console.log(inputSubCommand);
    try {
      if (inputSubCommand === subCommand.Create) {
        const name = interaction.options.getString("name", true);
        let character: Character = await this.characterRepository.findCharacterByDiscord({
          discord: guild.id,
          userId: user.id,
        });
        if (character) {
          await interaction.reply({
            embeds: [
              this.errorDiscordSerialiser.serialise({
                error: `You already have a character (${character.name}) on this server.`,
              }),
            ],
          });
          return;
        }
        character = await this.create({ guild: guild, user: user, name });
        const embed = this.characterDiscordSerialiser.serialise({ character });
        await interaction.reply(embed);
      } else if (inputSubCommand === subCommand.Display) {
        const characterMember = interaction.options.getMember("character");
        let targetUserId: string;
        if (characterMember) {
          const guildMember = characterMember as GuildMember;
          const userCharacter = await this.userRepository.findUserByDiscord({ discord: guildMember.user.id });
          if (userCharacter) targetUserId = userCharacter.id;
        }
        const character: Character = await this.characterRepository.findCharacterByDiscord({
          discord: guild.id,
          userId: targetUserId ?? user.id,
        });
        if (!character) {
          await interaction.reply({
            embeds: [this.errorDiscordSerialiser.serialise({ error: "No character found." })],
          });
          return;
        }
        const embed = this.characterDiscordSerialiser.serialise({ character });
        await interaction.reply(embed);
      } else if (inputSubCommand === subCommand.Avatar) {
        const link = interaction.options.getString("link", true);
        let character: Character = await this.characterRepository.findCharacterByDiscord({
          discord: guild.id,
          userId: user.id,
        });
        if (!character) {
          await interaction.reply({
            embeds: [this.errorDiscordSerialiser.serialise({ error: "No character found." })],
          });
          return;
        }
        character = await this.characterRepository.patch({ characterId: character.id, avatar: link });
        const embed = this.characterDiscordSerialiser.serialise({ character });
        await interaction.reply(embed);
      } else if (inputSubCommand === subCommand.Name) {
        const name = interaction.options.getString("name", true);
        let character: Character = await this.characterRepository.findCharacterByDiscord({
          discord: guild.id,
          userId: user.id,
        });
        if (!character) {
          await interaction.reply({
            embeds: [this.errorDiscordSerialiser.serialise({ error: "No character found." })],
          });
          return;
        }
        character = await this.characterRepository.patch({ characterId: character.id, name: name });
        const embed = this.characterDiscordSerialiser.serialise({ character });
        await interaction.reply(embed);
      }
      // Handle all attribute sub-commands generically
      else if (attributeKeys.includes(inputSubCommand)) {
        const proficiency = interaction.options.getString("proficiency", true);
        let character: Character = await this.characterRepository.findCharacterByDiscord({
          discord: guild.id,
          userId: user.id,
        });
        if (!character) {
          await interaction.reply({
            embeds: [this.errorDiscordSerialiser.serialise({ error: "No character found." })],
          });
          return;
        }
        // Build the patch object dynamically using the sub-command key
        const patchObj: any = { characterId: character.id };
        patchObj[inputSubCommand] = proficiency;
        character = await this.characterRepository.patch(patchObj);
        const embed = this.characterDiscordSerialiser.serialise({ character });
        await interaction.reply(embed);
      } else {
        await interaction.reply({
          embeds: [this.errorDiscordSerialiser.serialise({ error: "Invalid sub-command." })],
        });
      }
    } catch (error) {
      await interaction.reply({
        embeds: [
          this.errorDiscordSerialiser.serialise({
            error: "Error handling the character command",
            description: String(error),
          }),
        ],
      });
      this.logger.error("Error handling character command", error);
    }
  }

  private async create(params: { guild: Guild; user: User; name: string }): Promise<Character> {
    return this.characterRepository.create({
      characterId: randomUUID(),
      discord: params.guild.id,
      userId: params.user.id,
      name: params.name,
    });
  }
}

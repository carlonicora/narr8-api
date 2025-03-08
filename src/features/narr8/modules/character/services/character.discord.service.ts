import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ButtonInteraction, ChatInputCommandInteraction, Guild, GuildMember } from "discord.js";
import { attributes } from "src/common/enums/attributes";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";
import { CharacterSubCommand } from "src/features/narr8/modules/character/enums/character.sub.command";
import { CharacterRepository } from "src/features/narr8/modules/character/repositories/character.repository";
import { CharacterDiscordSerialiser } from "src/features/narr8/modules/character/serialisers/character.discord.serialiser";
import { GuildDiscordService } from "src/features/narr8/modules/guild/services/guild.discord.service";
import { User } from "src/features/narr8/modules/user/entities/user.entity";
import { UserRepository } from "src/features/narr8/modules/user/repositories/user.repository";
import { UserDiscordService } from "src/features/narr8/modules/user/services/user.discord.service";
import { UserService } from "src/features/narr8/modules/user/services/user.service";

@Injectable()
export class CharacterDiscordService {
  private readonly logger = new Logger(CharacterDiscordService.name);

  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly characterDiscordSerialiser: CharacterDiscordSerialiser,
    private readonly errorDiscordSerialiser: ErrorDiscordSerialiser,
    private readonly userRepository: UserRepository,
    private readonly guildDiscordService: GuildDiscordService,
    private readonly userDiscordService: UserDiscordService,
    private readonly userService: UserService,
  ) {}

  async handleCharacterCommand(interaction: ChatInputCommandInteraction) {
    const guild = await this.guildDiscordService.getGuild({ interaction: interaction });
    const guildUser = await this.userDiscordService.getUser({ interaction: interaction });
    const user = await this.userService.findOne({
      guildUser: guildUser,
    });

    const inputSubCommand = interaction.options.getSubcommand();

    const character: Character | null = await this.findOne({
      interaction: interaction,
      guild: guild,
      userId: user.id,
      create: inputSubCommand === CharacterSubCommand.Create,
    });

    if (!character && inputSubCommand !== CharacterSubCommand.Create) return;

    try {
      if (inputSubCommand === CharacterSubCommand.Create) {
        this.create({ interaction: interaction, guild: guild, user: user });
      } else if (inputSubCommand === CharacterSubCommand.Details) {
        await this.details({
          interaction: interaction,
          guild: guild,
          user: user,
          character: character,
        });
      } else if (inputSubCommand === CharacterSubCommand.Avatar) {
        await this.patchAvatar({
          interaction: interaction,
          guild: guild,
          user: user,
          character: character,
        });
      } else if (inputSubCommand === CharacterSubCommand.Name) {
        await this.patchName({
          interaction: interaction,
          guild: guild,
          user: user,
          character: character,
        });
      } else if (attributes.map((attribute) => attribute.name.toLowerCase()).includes(inputSubCommand.toLowerCase())) {
        await this.patchAttributeProficiency({
          interaction: interaction,
          guild: guild,
          user: user,
          character: character,
          inputSubCommand: inputSubCommand,
        });
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

  async handleButtonInteraction(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("/character detail")) return;

    const characterId = interaction.customId.split(":")[1];

    const guild = await this.guildDiscordService.getGuild({ interaction: interaction });
    const character = await this.findOneById({
      interaction: interaction,
      characterId: characterId,
    });

    if (!character) return;

    await this.details({ interaction: interaction, character: character, guild: guild, user: character.user });
  }

  private async patchAttributeProficiency(params: {
    interaction: ChatInputCommandInteraction;
    guild: Guild;
    user: User;
    character: Character;
    inputSubCommand: string;
  }) {
    const proficiency = params.interaction.options.getString("proficiency", true);

    const patchObj: any = { characterId: params.character.id };
    patchObj[params.inputSubCommand] = proficiency;
    const character = await this.characterRepository.patch(patchObj);
    await params.interaction.reply(this.characterDiscordSerialiser.serialise({ character: character }));
  }

  private async patchName(params: {
    interaction: ChatInputCommandInteraction;
    guild: Guild;
    user: User;
    character: Character;
  }) {
    const name = params.interaction.options.getString("name", true);

    const character = await this.characterRepository.patch({ characterId: params.character.id, name: name });
    await params.interaction.reply(this.characterDiscordSerialiser.serialise({ character: character }));
  }

  private async patchAvatar(params: {
    interaction: ChatInputCommandInteraction;
    guild: Guild;
    user: User;
    character: Character;
  }) {
    const link = params.interaction.options.getString("link", true);

    const character = await this.characterRepository.patch({ characterId: params.character.id, avatar: link });
    await params.interaction.reply(this.characterDiscordSerialiser.serialise({ character: character }));
  }

  private async details(params: {
    interaction: ChatInputCommandInteraction | ButtonInteraction;
    guild: Guild;
    user: User;
    character: Character;
  }) {
    if (params.interaction instanceof ChatInputCommandInteraction) {
      const characterMember = params.interaction.options.getMember("character");

      if (characterMember) {
        const userCharacter = await this.userRepository.findUserByDiscord({
          discord: (characterMember as GuildMember).user.id,
        });
        if (userCharacter)
          params.character = await this.findOne({
            interaction: params.interaction,
            guild: params.guild,
            userId: userCharacter.id,
            create: false,
          });

        if (!params.character) return;
      }
    }

    await params.interaction.reply(this.characterDiscordSerialiser.serialise({ character: params.character }));
  }

  async findOne(params: {
    interaction: ChatInputCommandInteraction | ButtonInteraction;
    guild: Guild;
    userId: string;
    create: boolean;
  }): Promise<Character | null> {
    const response: Character = await this.characterRepository.findCharacterByDiscord({
      discord: params.guild.id,
      userId: params.userId,
    });

    if (response && params.create) {
      await params.interaction.reply({
        embeds: [
          this.errorDiscordSerialiser.serialise({
            error: `You already have a character (${response.name}) on this server.`,
          }),
        ],
      });
      return;
    }

    if (!response && !params.create) {
      await params.interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "No character found." })],
      });
      return;
    }

    return response;
  }

  async findOneById(params: {
    interaction: ChatInputCommandInteraction | ButtonInteraction;
    characterId: string;
  }): Promise<Character | null> {
    const response: Character = await this.characterRepository.findOne({
      characterId: params.characterId,
    });

    if (!response) {
      await params.interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "No character found." })],
      });
      return;
    }

    return response;
  }

  private async create(params: { interaction: ChatInputCommandInteraction; guild: Guild; user: User }): Promise<void> {
    const name = params.interaction.options.getString("name", true);
    const newCharacter = await this.characterRepository.create({
      characterId: randomUUID(),
      discord: params.guild.id,
      userId: params.user.id,
      name: name,
    });
    await params.interaction.reply(this.characterDiscordSerialiser.serialise({ character: newCharacter }));
  }
}

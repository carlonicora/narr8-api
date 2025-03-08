import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { APIApplicationCommandSubcommandOption } from "discord-api-types/v10";
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildMember,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { Proficiencies } from "src/common/enums/proficiencies";
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
export class CharacterDiscordService implements OnModuleInit {
  private readonly logger = new Logger(CharacterDiscordService.name);

  constructor(
    @Inject(DISCORD_CLIENT) private readonly client: Client,
    private readonly characterRepository: CharacterRepository,
    private readonly characterDiscordSerialiser: CharacterDiscordSerialiser,
    private readonly errorDiscordSerialiser: ErrorDiscordSerialiser,
    private readonly userRepository: UserRepository,
  ) {}

  async onModuleInit() {
    if (this.client.isReady()) {
      await this.registerCommand();
    } else {
      this.client.once("ready", async () => {
        await this.registerCommand();
      });
    }

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      if (interaction.commandName !== "character") return;

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

      // Cast interaction to ChatInputCommandInteraction so getSubcommand is available.
      const chatInput = interaction as ChatInputCommandInteraction;
      const inputSubCommand = chatInput.options.getSubcommand();
      try {
        if (inputSubCommand === subCommand.Create) {
          const name = chatInput.options.getString("name", true);
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
          const characterMember = chatInput.options.getMember("character");
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
          const link = chatInput.options.getString("link", true);
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
          const name = chatInput.options.getString("name", true);
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
          const proficiency = chatInput.options.getString("proficiency", true);
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
    });
  }

  private async registerCommand() {
    // Build common attribute subcommand options using the attribute keys
    const buildAttributeSubCommands: APIApplicationCommandSubcommandOption[] = attributeKeys.map((key) => ({
      name: key,
      description: `Set your ${key.charAt(0).toUpperCase() + key.slice(1)} proficiency`,
      type: 1, // 1 corresponds to Subcommand
      options: [
        {
          name: "proficiency",
          description: `Choose your ${key.charAt(0).toUpperCase() + key.slice(1)} proficiency level`,
          type: 3, // 3 corresponds to String
          required: true,
          choices: [
            { name: Proficiencies.Unskilled, value: Proficiencies.Unskilled },
            { name: Proficiencies.Novice, value: Proficiencies.Novice },
            { name: Proficiencies.Skilled, value: Proficiencies.Skilled },
            { name: Proficiencies.Expert, value: Proficiencies.Expert },
            { name: Proficiencies.Master, value: Proficiencies.Master },
          ],
        },
      ],
    }));

    const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
      {
        name: "character",
        description: "Manage your Narr8 character on this server",
        options: [
          {
            name: subCommand.Create,
            description: "Create your character",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "name",
                description: "Name for your new character",
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
          {
            name: subCommand.Display,
            description: "Display your character",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "character",
                description: "User to display character for",
                type: ApplicationCommandOptionType.User,
                required: false,
              },
            ],
          },
          {
            name: subCommand.Avatar,
            description: "Set the avatar for your character",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "link",
                description: "The link to the avatar",
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
          {
            name: subCommand.Name,
            description: "Set the name of your character",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "name",
                description: "The name to the avatar",
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
          // Spread the attribute sub-commands (now a mutable array)
          ...buildAttributeSubCommands,
        ],
      },
    ];

    try {
      await this.client.application?.commands.set(commands);
      this.logger.log("DISCORD - Character commands registered globally");
    } catch (error) {
      this.logger.error("Failed to register character commands:", error);
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

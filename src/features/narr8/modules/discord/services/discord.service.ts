import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  APIApplicationCommandSubcommandOption,
  ApplicationCommandOptionType,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Interaction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RepliableInteraction,
} from "discord.js";
import { attributes } from "src/common/enums/attributes";
import { Proficiencies } from "src/common/enums/proficiencies";
import { DISCORD_CLIENT } from "src/common/providers/discord.client.provider";
import { CharacterSubCommand } from "src/features/narr8/modules/character/enums/character.sub.command";
import { CharacterDiscordService } from "../../character/services/character.discord.service";
import { RollDiscordService } from "../../roll/services/roll.discord.service";
import { ServerDiscordService } from "../../server/services/server.discord.service";

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    @Inject(DISCORD_CLIENT) private readonly client: Client,
    private readonly rollDiscordService: RollDiscordService,
    private readonly characterDiscordService: CharacterDiscordService,
    private readonly serverDiscordService: ServerDiscordService,
  ) {}

  async onModuleInit() {
    if (this.client.isReady()) {
      await this.registerCommand();
      this.setupInteractionHandler();
    } else {
      this.client.once("ready", async () => {
        await this.registerCommand();
        this.setupInteractionHandler();
      });
    }
  }

  private setupInteractionHandler() {
    this.client.on("interactionCreate", async (interaction: Interaction) => {
      try {
        if (interaction.isCommand()) {
          const commandName = interaction.commandName;

          switch (commandName) {
            case "roll":
              await this.rollDiscordService.handleRollCommand(interaction as ChatInputCommandInteraction);
              break;
            case "character":
              await this.characterDiscordService.handleCharacterCommand(interaction as ChatInputCommandInteraction);
              break;
            case "activate":
              await this.serverDiscordService.handleActivateCommand(interaction as ChatInputCommandInteraction);
              break;
            default:
              this.logger.warn(`Unknown command received: ${commandName}`);
          }
        } else if (interaction.isButton()) {
          const buttonId = (interaction as ButtonInteraction).customId;

          if (buttonId.startsWith("/roll")) {
            await this.rollDiscordService.handleButtonInteraction(interaction as ButtonInteraction);
          } else if (buttonId.startsWith("/character")) {
            await this.characterDiscordService.handleButtonInteraction(interaction as ButtonInteraction);
          }
        }
      } catch (error) {
        this.logger.error(`Error handling interaction: ${error.message}`, error.stack);
        // Try to respond to the interaction if possible
        try {
          if (interaction.isRepliable()) {
            // Check if the interaction hasn't been replied to
            const repliableInteraction = interaction as RepliableInteraction;
            if (!repliableInteraction.replied && !repliableInteraction.deferred) {
              await repliableInteraction.reply({
                content: "An error occurred while processing your command.",
                ephemeral: true,
              });
            }
          }
        } catch (replyError) {
          this.logger.error("Failed to send error response", replyError);
        }
      }
    });

    this.logger.log("Discord interaction handler initialized");
  }

  private async registerCommand() {
    const choices = attributes.map((attr) => ({
      name: attr.name,
      value: attr.name,
    }));

    const buildAttributeSubCommands: APIApplicationCommandSubcommandOption[] = attributes.map((attribute) => ({
      name: attribute.name.toLowerCase(),
      description: `Set your ${attribute.name} proficiency`,
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "proficiency",
          description: `Choose your ${attribute.name} proficiency level`,
          type: ApplicationCommandOptionType.String,
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
        name: "roll",
        description: "Roll an Attribute",
        options: [
          {
            name: "attribute",
            description: "Choose the attribute for the roll",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices,
          },
        ],
      },
      {
        name: "character",
        description: "Manage your Discord character on this server",
        options: [
          {
            name: CharacterSubCommand.Create,
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
            name: CharacterSubCommand.Details,
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
            name: CharacterSubCommand.Avatar,
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
            name: CharacterSubCommand.Name,
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
          ...buildAttributeSubCommands,
        ],
      },
      {
        name: "activate",
        description: "Activate Discord on this server.",
      },
    ];

    try {
      await this.client.application?.commands.set(commands);
      this.logger.log("Discord commands registered globally");
    } catch (error) {
      this.logger.error("Failed to register roll commands:", error);
    }
  }
}

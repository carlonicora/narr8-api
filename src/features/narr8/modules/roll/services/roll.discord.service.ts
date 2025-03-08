import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  ApplicationCommandOptionType,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Interaction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { attributes } from "src/common/enums/attributes";
import { DISCORD_CLIENT } from "src/common/providers/discord.client.provider";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";
import { CharacterRepository } from "src/features/narr8/modules/character/repositories/character.repository";
import { RollDiscordSerialiser } from "src/features/narr8/modules/roll/serialisers/roll.discord.serialiser";
import { RollService } from "src/features/narr8/modules/roll/services/roll.service";
import { User } from "src/features/narr8/modules/user/entities/user.entity";
import { UserRepository } from "src/features/narr8/modules/user/repositories/user.repository";

@Injectable()
export class RollDiscordService implements OnModuleInit {
  private readonly logger = new Logger(RollDiscordService.name);

  constructor(
    @Inject(DISCORD_CLIENT) private readonly client: Client,
    private readonly characterRepository: CharacterRepository,
    private readonly rollDiscordSerialiser: RollDiscordSerialiser,
    private readonly errorDiscordSerialiser: ErrorDiscordSerialiser,
    private readonly userRepository: UserRepository,
    private readonly rollService: RollService,
  ) {}

  async onModuleInit() {
    if (this.client.isReady()) {
      await this.registerCommand();
    } else {
      this.client.once("ready", async () => {
        await this.registerCommand();
      });
    }

    // Consolidated interaction handler for both slash commands and button interactions.
    this.client.on("interactionCreate", async (interaction: Interaction) => {
      // Only process if the interaction is a command or a button.
      if (!interaction.isCommand() && !interaction.isButton()) return;

      // Common guild and user checks.
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

      // Lookup or create user.
      let user: User = await this.userRepository.findUserByDiscord({ discord: guildUser.id });
      if (!user) {
        user = await this.userRepository.create({
          id: randomUUID(),
          discord: guildUser.id,
          name: guildUser.username,
        });
      }

      // Lookup character.
      const character: Character = await this.characterRepository.findCharacterByDiscord({
        discord: guild.id,
        userId: user.id,
      });
      if (!character) {
        await interaction.reply({
          embeds: [this.errorDiscordSerialiser.serialise({ error: "No character found." })],
        });
        return;
      }

      // Determine attribute name.
      let attributeName: string | null = null;
      if (interaction.isCommand() && interaction.commandName === "roll") {
        const chatInput = interaction as ChatInputCommandInteraction;
        attributeName = chatInput.options.getString("attribute", true);
      } else if (interaction.isButton()) {
        const btnInteraction = interaction as ButtonInteraction;
        if (btnInteraction.customId.startsWith("/roll attribute:")) {
          // Example: "/roll attribute:Agility"
          attributeName = btnInteraction.customId.split(":")[1];
        }
      }

      if (!attributeName) {
        await interaction.reply({
          embeds: [this.errorDiscordSerialiser.serialise({ error: "No attribute provided." })],
        });
        return;
      }

      const attribute = character.attribute.find((attr) => attr.name.toLowerCase() === attributeName.toLowerCase());
      if (!attribute) {
        await interaction.reply({
          embeds: [this.errorDiscordSerialiser.serialise({ error: "Attribute not found." })],
        });
        return;
      }

      // Determine proficiency numeric value.
      let attributeValue = 16;
      switch (attribute.proficiency) {
        case "Unskilled":
          attributeValue = 16;
          break;
        case "Novice":
          attributeValue = 13;
          break;
        case "Skilled":
          attributeValue = 10;
          break;
        case "Expert":
          attributeValue = 7;
          break;
        case "Master":
          attributeValue = 4;
          break;
      }

      try {
        const roll = this.rollService.roll({ proficiency: attributeValue });
        await interaction.reply(
          this.rollDiscordSerialiser.serialise({
            character: character,
            attribute: attribute,
            roll: roll,
          }),
        );
      } catch (error) {
        await interaction.reply({
          embeds: [
            this.errorDiscordSerialiser.serialise({
              error: "Error handling the roll command",
              description: String(error),
            }),
          ],
        });
        this.logger.error("Error handling roll command", error);
      }
    });
  }

  private async registerCommand() {
    const choices = attributes.map((attr) => ({
      name: attr.name,
      value: attr.name,
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
    ];

    try {
      await this.client.application?.commands.set(commands);
      this.logger.log("DISCORD - Roll commands registered globally");
    } catch (error) {
      this.logger.error("Failed to register roll commands:", error);
    }
  }
}

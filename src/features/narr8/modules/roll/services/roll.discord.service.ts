import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ButtonInteraction, ChatInputCommandInteraction, Client } from "discord.js";
import { DISCORD_CLIENT } from "src/common/providers/discord.client.provider";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";
import { CharacterRepository } from "src/features/narr8/modules/character/repositories/character.repository";
import { RollDiscordSerialiser } from "src/features/narr8/modules/roll/serialisers/roll.discord.serialiser";
import { RollService } from "src/features/narr8/modules/roll/services/roll.service";
import { User } from "src/features/narr8/modules/user/entities/user.entity";
import { UserRepository } from "src/features/narr8/modules/user/repositories/user.repository";

@Injectable()
export class RollDiscordService {
  private readonly logger = new Logger(RollDiscordService.name);

  constructor(
    @Inject(DISCORD_CLIENT) private readonly client: Client,
    private readonly characterRepository: CharacterRepository,
    private readonly rollDiscordSerialiser: RollDiscordSerialiser,
    private readonly errorDiscordSerialiser: ErrorDiscordSerialiser,
    private readonly userRepository: UserRepository,
    private readonly rollService: RollService,
  ) {}

  async handleRollCommand(interaction: ChatInputCommandInteraction) {
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

    // Get attribute name from command with better error handling
    let attributeName: string;
    try {
      attributeName = interaction.options.getString("attribute", true);
    } catch (error) {
      await interaction.reply({
        embeds: [
          this.errorDiscordSerialiser.serialise({
            error: "Missing required attribute option",
            description: "Please provide an attribute to roll.",
          }),
        ],
      });
      this.logger.error("Roll command missing required attribute option", error);
      return;
    }

    await this.processRoll(interaction, character, attributeName);
  }

  async handleButtonInteraction(interaction: ButtonInteraction) {
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

    // Get attribute name from button custom ID
    let attributeName = null;
    if (interaction.customId.startsWith("/roll attribute:")) {
      attributeName = interaction.customId.split(":")[1];
    }

    await this.processRoll(interaction, character, attributeName);
  }

  // Shared logic for processing rolls
  private async processRoll(
    interaction: ButtonInteraction | ChatInputCommandInteraction,
    character: Character,
    attributeName: string | null,
  ) {
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
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import { ProficiencyValue } from "src/common/enums/proficieancy.value";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";
import { CharacterRepository } from "src/features/narr8/modules/character/repositories/character.repository";
import { CharacterDiscordService } from "src/features/narr8/modules/character/services/character.discord.service";
import { GuildDiscordService } from "src/features/narr8/modules/guild/services/guild.discord.service";
import { RollDiscordSerialiser } from "src/features/narr8/modules/roll/serialisers/roll.discord.serialiser";
import { RollService } from "src/features/narr8/modules/roll/services/roll.service";
import { UserRepository } from "src/features/narr8/modules/user/repositories/user.repository";
import { UserDiscordService } from "src/features/narr8/modules/user/services/user.discord.service";
import { UserService } from "src/features/narr8/modules/user/services/user.service";

@Injectable()
export class RollDiscordService {
  private readonly logger = new Logger(RollDiscordService.name);

  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly rollDiscordSerialiser: RollDiscordSerialiser,
    private readonly errorDiscordSerialiser: ErrorDiscordSerialiser,
    private readonly userRepository: UserRepository,
    private readonly rollService: RollService,
    private readonly guildDiscordService: GuildDiscordService,
    private readonly userDiscordService: UserDiscordService,
    private readonly userService: UserService,
    private readonly characterDiscordService: CharacterDiscordService,
  ) {}

  async handleRollCommand(interaction: ChatInputCommandInteraction) {
    const guild = await this.guildDiscordService.getGuild({ interaction: interaction });
    const guildUser = await this.userDiscordService.getUser({ interaction: interaction });
    const user = await this.userService.findOne({
      guildUser: guildUser,
    });

    const character: Character | null = await this.characterDiscordService.findOne({
      interaction: interaction,
      guild: guild,
      userId: user.id,
      create: false,
    });

    if (!character) return;

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
    const guild = await this.guildDiscordService.getGuild({ interaction: interaction });
    const guildUser = await this.userDiscordService.getUser({ interaction: interaction });
    const user = await this.userService.findOne({
      guildUser: guildUser,
    });

    const character: Character | null = await this.characterDiscordService.findOne({
      interaction: interaction,
      guild: guild,
      userId: user.id,
      create: false,
    });

    if (!character) return;

    let attributeName = null;
    if (interaction.customId.startsWith("/roll attribute:")) {
      attributeName = interaction.customId.split(":")[1];
    }

    await this.processRoll(interaction, character, attributeName);
  }

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

    try {
      const roll = this.rollService.roll({ proficiency: ProficiencyValue[attribute.proficiency] });
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

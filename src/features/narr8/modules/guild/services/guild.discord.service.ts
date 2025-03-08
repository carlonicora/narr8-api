import { Injectable, Logger } from "@nestjs/common";
import { ButtonInteraction, ChatInputCommandInteraction, Guild } from "discord.js";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";

@Injectable()
export class GuildDiscordService {
  private readonly logger = new Logger(GuildDiscordService.name);

  constructor(private readonly errorDiscordSerialiser: ErrorDiscordSerialiser) {}

  async getGuild(params: { interaction: ChatInputCommandInteraction | ButtonInteraction }): Promise<Guild> {
    const response = params.interaction.guild;

    if (!response) {
      await params.interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "Command used outside of a guild." })],
      });
      this.logger.error("Command used outside of a guild.");
    }

    return response;
  }
}

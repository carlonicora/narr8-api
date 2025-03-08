import { Injectable, Logger } from "@nestjs/common";
import { ButtonInteraction, ChatInputCommandInteraction, User } from "discord.js";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";

@Injectable()
export class UserDiscordService {
  private readonly logger = new Logger(UserDiscordService.name);

  constructor(private readonly errorDiscordSerialiser: ErrorDiscordSerialiser) {}

  async getUser(params: { interaction: ChatInputCommandInteraction | ButtonInteraction }): Promise<User> {
    const response = params.interaction.user;

    if (!response) {
      await params.interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "Command used by a non-guild user." })],
      });
      this.logger.error("Command used by a non-guild user.");
      return;
    }

    return response;
  }
}

import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Client } from "discord.js";
import { DISCORD_CLIENT } from "src/common/providers/discord.client.provider";

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);

  constructor(@Inject(DISCORD_CLIENT) private readonly client: Client) {}

  onModuleInit() {
    this.client.once("ready", () => {
      this.logger.log(`Discord Bot connected as ${this.client.user.tag}`);
    });
  }
}

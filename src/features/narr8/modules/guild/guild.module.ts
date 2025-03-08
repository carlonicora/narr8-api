import { Module } from "@nestjs/common";
import { GuildDiscordService } from "src/features/narr8/modules/guild/services/guild.discord.service";

@Module({
  controllers: [],
  providers: [GuildDiscordService],
  exports: [GuildDiscordService],
  imports: [],
})
export class GuildModule {}

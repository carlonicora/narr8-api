import { Module } from "@nestjs/common";
import { CharacterModule } from "src/features/narr8/modules/character/character.module";
import { DiscordService } from "src/features/narr8/modules/discord/services/discord.service";
import { RollModule } from "src/features/narr8/modules/roll/roll.module";
import { ServerModule } from "src/features/narr8/modules/server/server.module";

@Module({
  controllers: [],
  providers: [DiscordService],
  exports: [DiscordService],
  imports: [RollModule, CharacterModule, ServerModule],
})
export class DiscordModule {}

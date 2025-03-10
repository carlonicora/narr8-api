import { Module, OnModuleInit } from "@nestjs/common";
import { CharacterModule } from "src/features/narr8/modules/character/character.module";
import { GuildModule } from "src/features/narr8/modules/guild/guild.module";
import { RollDiscordSerialiser } from "src/features/narr8/modules/roll/serialisers/roll.discord.serialiser";
import { RollDiscordService } from "src/features/narr8/modules/roll/services/roll.discord.service";
import { RollService } from "src/features/narr8/modules/roll/services/roll.service";
import { UserModule } from "src/features/narr8/modules/user/user.module";

@Module({
  controllers: [],
  providers: [RollDiscordService, RollService, RollDiscordSerialiser],
  exports: [RollDiscordService],
  imports: [CharacterModule, GuildModule, UserModule],
})
export class RollModule implements OnModuleInit {
  onModuleInit() {}
}

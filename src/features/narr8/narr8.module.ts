import { Module } from "@nestjs/common";
import { CharacterModule } from "src/features/narr8/modules/character/character.module";
import { DiscordModule } from "src/features/narr8/modules/discord/discord.module";
import { GuildModule } from "src/features/narr8/modules/guild/guild.module";
import { RollModule } from "src/features/narr8/modules/roll/roll.module";
import { ServerModule } from "src/features/narr8/modules/server/server.module";
import { UserModule } from "src/features/narr8/modules/user/user.module";

@Module({
  imports: [CharacterModule, DiscordModule, GuildModule, RollModule, ServerModule, UserModule],
})
export class Narr8Module {}

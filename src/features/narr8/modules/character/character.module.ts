import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "src/common/registries/model/registry";
import { AttributeModel } from "src/features/narr8/modules/character/entities/attribute.entity";
import { CharacterModel } from "src/features/narr8/modules/character/entities/character.entity";
import { CharacterDiscordSerialiser } from "src/features/narr8/modules/character/serialisers/character.discord.serialiser";
import { CharacterDiscordService } from "src/features/narr8/modules/character/services/character.discord.service";
import { GuildModule } from "src/features/narr8/modules/guild/guild.module";
import { UserModule } from "src/features/narr8/modules/user/user.module";
import { CharacterRepository } from "./repositories/character.repository";

@Module({
  controllers: [],
  providers: [CharacterRepository, CharacterDiscordService, CharacterDiscordSerialiser],
  exports: [CharacterRepository, CharacterDiscordService],
  imports: [GuildModule, UserModule],
})
export class CharacterModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(CharacterModel);
    modelRegistry.register(AttributeModel);
  }
}

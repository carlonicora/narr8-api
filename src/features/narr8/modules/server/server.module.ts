import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "src/common/registries/model/registry";
import { ServerModel } from "src/features/narr8/modules/server/entities/server.entity";
import { ServerDiscordSerialiser } from "src/features/narr8/modules/server/serialisers/server.discord.serialiser";
import { ServerDiscordService } from "src/features/narr8/modules/server/services/server.discord.service";
import { UserModule } from "src/features/narr8/modules/user/user.module";
import { ServerRepository } from "./repositories/server.repository";

@Module({
  controllers: [],
  providers: [ServerRepository, ServerDiscordService, ServerDiscordSerialiser],
  exports: [],
  imports: [UserModule],
})
export class ServerModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(ServerModel);
  }
}

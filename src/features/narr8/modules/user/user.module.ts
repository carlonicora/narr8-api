import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "src/common/registries/model/registry";
import { UserModel } from "src/features/narr8/modules/user/entities/user.entity";
import { UserDiscordService } from "src/features/narr8/modules/user/services/user.discord.service";
import { UserService } from "src/features/narr8/modules/user/services/user.service";
import { UserRepository } from "./repositories/user.repository";

@Module({
  controllers: [],
  providers: [UserRepository, UserDiscordService, UserService],
  exports: [UserRepository, UserDiscordService, UserService],
  imports: [],
})
export class UserModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(UserModel);
  }
}

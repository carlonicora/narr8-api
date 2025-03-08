import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "src/common/registries/model/registry";
import { UserModel } from "src/features/narr8/modules/user/entities/user.entity";
import { UserRepository } from "./repositories/user.repository";

@Module({
  controllers: [],
  providers: [UserRepository],
  exports: [UserRepository],
  imports: [],
})
export class UserModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(UserModel);
  }
}

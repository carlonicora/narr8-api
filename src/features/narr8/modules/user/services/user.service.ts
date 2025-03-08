import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { User as GuildUser } from "discord.js";
import { User } from "src/features/narr8/modules/user/entities/user.entity";
import { UserRepository } from "src/features/narr8/modules/user/repositories/user.repository";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async findOne(params: { guildUser: GuildUser }): Promise<User> {
    let response: User = await this.userRepository.findUserByDiscord({ discord: params.guildUser.id });

    if (!response) {
      response = await this.userRepository.create({
        id: randomUUID(),
        discord: params.guildUser.id,
        name: params.guildUser.username,
      });
    }

    return response;
  }
}

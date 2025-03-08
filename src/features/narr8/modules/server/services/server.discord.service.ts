import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ChatInputCommandInteraction, Client, Guild } from "discord.js";
import { DISCORD_CLIENT } from "src/common/providers/discord.client.provider";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";
import { Server } from "src/features/narr8/modules/server/entities/server.entity";
import { ServerRepository } from "src/features/narr8/modules/server/repositories/server.repository";
import { ServerDiscordSerialiser } from "src/features/narr8/modules/server/serialisers/server.discord.serialiser";
import { User } from "src/features/narr8/modules/user/entities/user.entity";
import { UserRepository } from "src/features/narr8/modules/user/repositories/user.repository";

@Injectable()
export class ServerDiscordService {
  private readonly logger = new Logger(ServerDiscordService.name);

  constructor(
    @Inject(DISCORD_CLIENT) private readonly client: Client,
    private readonly serverRepository: ServerRepository,
    private readonly serverDiscordSerialiser: ServerDiscordSerialiser,
    private readonly errorDiscordSerialiser: ErrorDiscordSerialiser,
    private readonly userRepository: UserRepository,
  ) {}

  async handleActivateCommand(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "Command used outside of a guild." })],
      });
      this.logger.error("Command used outside of a guild.");
      return;
    }

    const guildUser = interaction.user;
    if (!guildUser) {
      await interaction.reply({
        embeds: [this.errorDiscordSerialiser.serialise({ error: "Command used by a non-guild user." })],
      });
      this.logger.error("Command used by a non-guild user.");
      return;
    }

    let user: User = await this.userRepository.findUserByDiscord({ discord: guildUser.id });
    if (!user) {
      user = await this.userRepository.create({
        id: randomUUID(),
        discord: guildUser.id,
        name: guildUser.username,
      });
    }

    try {
      let server: Server = await this.serverRepository.findServerByDiscord({ discord: guild.id });
      if (server) {
        await interaction.reply({
          embeds: [this.errorDiscordSerialiser.serialise({ error: "A server already exists for this guild." })],
        });
        return;
      }

      server = await this.create({ guild: guild, user: user });

      const embed = this.serverDiscordSerialiser.serialise({ server: server });
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({
        embeds: [
          this.errorDiscordSerialiser.serialise({
            error: "Error replying to /activate interaction",
            description: error,
          }),
        ],
      });
      this.logger.error("Error replying to /activate interaction", error);
    }
  }

  private async create(params: { guild: Guild; user: User }): Promise<Server> {
    return this.serverRepository.create({
      serverId: randomUUID(),
      discord: params.guild.id,
      name: params.guild.name,
      user: params.user,
    });
  }
}

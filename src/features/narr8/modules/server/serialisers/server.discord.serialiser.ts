import { Injectable } from "@nestjs/common";
import { EmbedBuilder } from "discord.js";
import { Server } from "src/features/narr8/modules/server/entities/server.entity";

@Injectable()
export class ServerDiscordSerialiser {
  serialise(params: { server: Server }): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`Server Created`)
      .setDescription(`Narr8 is now tracking server ${params.server.name}`)
      .setColor(0x00ae86);

    return embed;
  }
}

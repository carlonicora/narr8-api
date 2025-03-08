import { Injectable } from "@nestjs/common";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { DiscordSerialiser } from "src/common/serialisers/abstract discord.serialiser";
import { Attribute } from "src/features/narr8/modules/character/entities/attribute.entity";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";

@Injectable()
export class CharacterDiscordSerialiser extends DiscordSerialiser {
  serialise(params: { character: Character }): {
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
  } {
    const embed = this.createEmbed({
      characterName: params.character.name,
      avatar: params.character.avatar,
      userName: params.character.user.name,
    });

    embed.setDescription(`------------------------------------------`);
    embed.setTimestamp(new Date());

    const attributes = params.character.attribute;
    const maxNameLength = Math.max(...attributes.map((attr: Attribute) => attr.name.length));

    const paddedAttributes = attributes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((attr: Attribute) => `${attr.name.padEnd(maxNameLength, " ")} - ${attr.proficiency}`)
      .join("\n");

    embed.addFields({
      name: "Attribute",
      value: "```\n" + paddedAttributes + "\n```",
      inline: false,
    });

    return {
      embeds: [embed],
      components: this.createButtons(params.character),
    };
  }
}

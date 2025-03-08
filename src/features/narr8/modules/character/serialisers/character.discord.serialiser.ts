import { Injectable } from "@nestjs/common";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { DiscordSerialiser } from "src/common/serialisers/abstract discord.serialiser";
import { Attribute } from "src/features/narr8/modules/attribute/entities/attribute.entity";
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

    // Calculate the maximum attribute name length
    const attributes = params.character.attribute;
    const maxNameLength = Math.max(...attributes.map((attr: Attribute) => attr.name.length));

    // Pad attribute names and prepare text
    const paddedAttributes = attributes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((attr: Attribute) => `${attr.name.padEnd(maxNameLength, " ")} - ${attr.proficiency}`)
      .join("\n");

    // Wrap in a code block to enforce monospace formatting
    embed.addFields({
      name: "Attribute",
      value: "```\n" + paddedAttributes + "\n```",
      inline: false,
    });

    // const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //   new ButtonBuilder().setCustomId("/roll attribute:Strength").setLabel("Strength").setStyle(ButtonStyle.Secondary),
    //   new ButtonBuilder().setCustomId("/roll attribute:Agility").setLabel("Agility").setStyle(ButtonStyle.Secondary),
    // );

    // const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //   new ButtonBuilder()
    //     .setCustomId("/roll attribute:Awareness")
    //     .setLabel("Awareness")
    //     .setStyle(ButtonStyle.Secondary),
    //   new ButtonBuilder()
    //     .setCustomId("/roll attribute:Intellect")
    //     .setLabel("Intellect")
    //     .setStyle(ButtonStyle.Secondary),
    // );

    // const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //   new ButtonBuilder()
    //     .setCustomId("/roll attribute:Willpower")
    //     .setLabel("Willpower")
    //     .setStyle(ButtonStyle.Secondary),
    //   new ButtonBuilder().setCustomId("/roll attribute:Empathy").setLabel("Empathy").setStyle(ButtonStyle.Secondary),
    // );

    // const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //   new ButtonBuilder().setCustomId("/roll attribute:Occult").setLabel("Occult").setStyle(ButtonStyle.Secondary),
    //   new ButtonBuilder().setCustomId("/roll attribute:Charisma").setLabel("Charisma").setStyle(ButtonStyle.Secondary),
    // );

    // New row: A select menu for rolling abilities
    // const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    //   new StringSelectMenuBuilder()
    //     .setCustomId("roll_ability_select")
    //     .setPlaceholder("Roll Ability")
    //     .addOptions(
    //       attributes.map((attr: Attribute) => ({
    //         label: attr.name,
    //         value: `/roll ability:${attr.name}`,
    //       })),
    //     ),
    // );

    return {
      embeds: [embed],
      // components: [row1, row2, row3, row4, selectRow],
      // components: [selectRow],
      components: this.createButtons(),
    };
  }
}

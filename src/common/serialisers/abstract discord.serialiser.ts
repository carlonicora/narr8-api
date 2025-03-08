import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";

export abstract class DiscordSerialiser {
  protected createEmbed(params: { characterName: string; avatar?: string; userName: string }): EmbedBuilder {
    const embed = new EmbedBuilder();

    embed.setColor(0x0000ff);
    embed.setAuthor({ name: params.userName, iconURL: params.avatar });
    embed.setTitle(params.characterName);
    embed.setThumbnail(params.avatar);
    embed.setFooter({ text: `Narr8` });
    embed.setTimestamp(new Date());

    return embed;
  }

  protected createButtons(): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("/roll attribute:Strength").setLabel("Strength").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("/roll attribute:Agility").setLabel("Agility").setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("/roll attribute:Awareness")
        .setLabel("Awareness")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("/roll attribute:Intellect")
        .setLabel("Intellect")
        .setStyle(ButtonStyle.Secondary),
    );

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("/roll attribute:Willpower")
        .setLabel("Willpower")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("/roll attribute:Empathy").setLabel("Empathy").setStyle(ButtonStyle.Secondary),
    );

    const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("/roll attribute:Occult").setLabel("Occult").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("/roll attribute:Charisma").setLabel("Charisma").setStyle(ButtonStyle.Secondary),
    );

    return [row1, row2, row3, row4];
  }
}

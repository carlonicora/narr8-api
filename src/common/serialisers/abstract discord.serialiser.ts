import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { readFileSync } from "fs";
import { join } from "path";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";

export abstract class DiscordSerialiser {
  protected createEmbed(params: { characterName: string; avatar?: string; userName: string }): EmbedBuilder {
    let version = "0.0.0";
    try {
      const packageJsonPath = join(process.cwd(), "package.json");
      const packageJsonContent = readFileSync(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonContent);
      version = packageJson.version;
    } catch (error) {}

    const embed = new EmbedBuilder();

    embed.setColor(0x0000ff);
    embed.setAuthor({ name: params.userName, iconURL: params.avatar });
    embed.setTitle(params.characterName);
    embed.setThumbnail(params.avatar);
    embed.setFooter({ text: `Narr8 - v${version}` });
    embed.setTimestamp(new Date());

    return embed;
  }

  protected createButtons(character: Character): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
    const row0 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`/character detail character:${character.id}`)
        .setLabel("Character Record Sheet")
        .setStyle(ButtonStyle.Primary),
    );

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("/roll attribute:Agility").setLabel("Agility").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("/roll attribute:Awareness")
        .setLabel("Awareness")
        .setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("/roll attribute:Charisma").setLabel("Charisma").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("/roll attribute:Empathy").setLabel("Empathy").setStyle(ButtonStyle.Secondary),
    );

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("/roll attribute:Intellect")
        .setLabel("Intellect")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("/roll attribute:Occult").setLabel("Occult").setStyle(ButtonStyle.Secondary),
    );

    const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("/roll attribute:Strength").setLabel("Strength").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("/roll attribute:Willpower")
        .setLabel("Willpower")
        .setStyle(ButtonStyle.Secondary),
    );

    return [row0, row1, row2, row3, row4];
  }
}

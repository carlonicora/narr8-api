import { Injectable } from "@nestjs/common";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { DiscordSerialiser } from "src/common/serialisers/abstract discord.serialiser";
import { Attribute } from "src/features/narr8/modules/attribute/entities/attribute.entity";
import { Character } from "src/features/narr8/modules/character/entities/character.entity";
import { Roll, RollResult } from "src/features/narr8/modules/roll/services/roll.service";

@Injectable()
export class RollDiscordSerialiser extends DiscordSerialiser {
  serialise(params: { character: Character; attribute: Attribute; roll: Roll }): {
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
  } {
    const embed = this.createEmbed({
      characterName: params.character.name,
      avatar: params.character.avatar,
      userName: params.character.user.name,
    });

    let colour: number;
    switch (params.roll.result) {
      case RollResult.AstronomicalSuccess:
        colour = 0x66ff66;
        break;
      case RollResult.CriticalSuccess:
        colour = 0x00ff00;
        break;
      case RollResult.Success:
        colour = 0x00cc00;
        break;
      case RollResult.Failure:
        colour = 0xff9900;
        break;
      case RollResult.CriticalFailure:
        colour = 0xff3333;
        break;
      case RollResult.AstronomicalFailure:
        colour = 0xcc0000;
        break;
      default:
        colour = 0x000000;
    }

    embed.setColor(colour);

    embed.setTitle(
      `${params.attribute.name}: ${params.roll.result}${
        params.roll.successes !== undefined
          ? ` (${params.roll.successes >= 0 ? `+${params.roll.successes}` : params.roll.successes})`
          : ``
      }`,
    );

    let rollText = `Roll: ${params.roll.firstRoll}`;
    if (params.roll.secondRoll) {
      rollText = `First Roll: ${params.roll.firstRoll}
Second Roll: ${params.roll.secondRoll}`;
    }

    if (params.roll.successes !== undefined) {
      if (params.roll.successes >= 0) {
        rollText += `\nSuccesses Rate: +${params.roll.successes}`;
      } else {
        rollText += `\nFailure Rate: ${params.roll.successes}`;
      }
    }

    embed.setDescription(
      `${params.attribute.name} roll for ${params.character.name}
------------------------------------------
Attribute Proficiency: **${params.attribute.proficiency}**
${rollText}
`,
    );

    return {
      embeds: [embed],
      components: this.createButtons(),
    };
  }
}

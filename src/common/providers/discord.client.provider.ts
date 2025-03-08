import { Client, GatewayIntentBits } from "discord.js";

export const DISCORD_CLIENT = "DISCORD_CLIENT";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

export const discordClientProvider = {
  provide: DISCORD_CLIENT,
  useFactory: async () => {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error("Discord token not found in environment variables.");
    }
    return client.login(token).then(() => client);
  },
};

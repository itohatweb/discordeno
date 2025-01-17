import { botId } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { CreateGuild } from "../../types/guilds/create_guild.ts";
import { DiscordGuild } from "../../types/guilds/guild.ts";
import { endpoints } from "../../util/constants.ts";
import { getMember } from "../members/get_member.ts";

/** Create a new guild. Returns a guild object on success. Fires a Guild Create Gateway event. This endpoint can be used only by bots in less than 10 guilds. */
export async function createGuild(options: CreateGuild) {
  const result = (await rest.runMethod(
    "post",
    endpoints.GUILDS,
    options
  )) as DiscordGuild;

  const guild = await structures.createDiscordenoGuild(result, 0);
  // MANUALLY CACHE THE GUILD
  await cacheHandlers.set("guilds", guild.id, guild);
  // MANUALLY CACHE THE BOT
  await getMember(guild.id, botId)

  return guild;
}

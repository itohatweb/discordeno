import { botId, eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordGatewayPayload } from "../../types/gateway/gateway_payload.ts";
import { DiscordMessageReactionAdd } from "../../types/messages/message_reaction_add.ts";

export async function handleMessageReactionAdd(data: DiscordGatewayPayload) {
  const payload = data.d as DiscordMessageReactionAdd;
  const message = await cacheHandlers.get("messages", payload.message_id);

  if (message) {
    const reactionExisted = message.reactions?.find(
      (reaction) =>
        reaction.emoji.id === payload.emoji.id &&
        reaction.emoji.name === payload.emoji.name,
    );

    if (reactionExisted) reactionExisted.count++;
    else {
      const newReaction = {
        count: 1,
        me: payload.user_id === botId,
        emoji: { ...payload.emoji, id: payload.emoji.id || undefined },
      };
      message.reactions = message.reactions
        ? [...message.reactions, newReaction]
        : [newReaction];
    }

    await cacheHandlers.set("messages", payload.message_id, message);
  }

  if (payload.member && payload.guild_id) {
    const guild = await cacheHandlers.get("guilds", payload.guild_id);
    if (guild) {
      const discordenoMember = await structures.createDiscordenoMember(
        payload.member,
        guild.id,
      );
      await cacheHandlers.set("members", discordenoMember.id, discordenoMember);
    }
  }

  const uncachedOptions = {
    ...payload,
    id: payload.message_id,
    channelId: payload.channel_id,
    guildId: payload.guild_id || "",
  };

  eventHandlers.reactionAdd?.(
    uncachedOptions,
    payload.emoji,
    payload.user_id,
    message,
  );
}

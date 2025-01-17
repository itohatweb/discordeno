import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordChannelTypes } from "../../types/channels/channel_types.ts";
import { DiscordAllowedMentionsTypes } from "../../types/messages/allowed_mentions_types.ts";
import { CreateMessage } from "../../types/messages/create_message.ts";
import { DiscordMessage } from "../../types/messages/message.ts";
import { Errors } from "../../types/misc/errors.ts";
import { PermissionStrings } from "../../types/permissions/permission_strings.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
import { camelKeysToSnakeCase } from "../../util/utils.ts";

/** Send a message to the channel. Requires SEND_MESSAGES permission. */
export async function sendMessage(
  channelId: string,
  content: string | CreateMessage
) {
  if (typeof content === "string") content = { content };

  const channel = await cacheHandlers.get("channels", channelId);
  if (channel) {
    if (
      ![
        DiscordChannelTypes.DM,
        DiscordChannelTypes.GUILD_NEWS,
        DiscordChannelTypes.GUILD_TEXT,
      ].includes(channel.type)
    ) {
      throw new Error(Errors.CHANNEL_NOT_TEXT_BASED);
    }

    const requiredPerms: Set<PermissionStrings> = new Set([
      "SEND_MESSAGES",
      "VIEW_CHANNEL",
    ]);

    if (content.tts) requiredPerms.add("SEND_TTS_MESSAGES");
    if (content.embed) requiredPerms.add("EMBED_LINKS");
    if (
      content.messageReference?.messageId ||
      content.allowedMentions?.repliedUser
    ) {
      requiredPerms.add("READ_MESSAGE_HISTORY");
    }

    await requireBotChannelPermissions(channelId, [...requiredPerms]);
  }

  // Use ... for content length due to unicode characters and js .length handling
  if (content.content && [...content.content].length > 2000) {
    throw new Error(Errors.MESSAGE_MAX_LENGTH);
  }

  if (content.allowedMentions) {
    if (content.allowedMentions.users?.length) {
      if (
        content.allowedMentions.parse?.includes(
          DiscordAllowedMentionsTypes.UserMentions
        )
      ) {
        content.allowedMentions.parse = content.allowedMentions.parse.filter(
          (p) => p !== "users"
        );
      }

      if (content.allowedMentions.users.length > 100) {
        content.allowedMentions.users = content.allowedMentions.users.slice(
          0,
          100
        );
      }
    }

    if (content.allowedMentions.roles?.length) {
      if (
        content.allowedMentions.parse?.includes(
          DiscordAllowedMentionsTypes.RoleMentions
        )
      ) {
        content.allowedMentions.parse = content.allowedMentions.parse.filter(
          (p) => p !== "roles"
        );
      }

      if (content.allowedMentions.roles.length > 100) {
        content.allowedMentions.roles = content.allowedMentions.roles.slice(
          0,
          100
        );
      }
    }
  }

  const result = (await rest.runMethod(
    "post",
    endpoints.CHANNEL_MESSAGES(channelId),
    camelKeysToSnakeCase({
      ...content,
      ...(content.messageReference?.messageId
        ? {
            messageReference: {
              ...content.messageReference,
              failIfNotExists:
                content.messageReference.failIfNotExists === true,
            },
          }
        : {}),
    })
  )) as DiscordMessage;

  return structures.createDiscordenoMessage(result);
}

import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordAllowedMentionsTypes } from "../../types/messages/allowed_mentions_types.ts";
import { DiscordMessage } from "../../types/messages/message.ts";
import { Errors } from "../../types/misc/errors.ts";
import { ExecuteWebhook } from "../../types/webhooks/execute_webhook.ts";
import { endpoints } from "../../util/constants.ts";

/** Execute a webhook with webhook Id and webhook token */
export async function executeWebhook(
  webhookId: string,
  webhookToken: string,
  options: ExecuteWebhook
) {
  if (!options.content && !options.file && !options.embeds) {
    throw new Error(Errors.INVALID_WEBHOOK_OPTIONS);
  }

  if (options.content && options.content.length > 2000) {
    throw Error(Errors.MESSAGE_MAX_LENGTH);
  }

  if (options.embeds && options.embeds.length > 10) {
    options.embeds.splice(10);
  }

  if (options.allowedMentions) {
    if (options.allowedMentions.users?.length) {
      if (
        options.allowedMentions.parse.includes(
          DiscordAllowedMentionsTypes.UserMentions
        )
      ) {
        options.allowedMentions.parse = options.allowedMentions.parse.filter(
          (p) => p !== "users"
        );
      }

      if (options.allowedMentions.users.length > 100) {
        options.allowedMentions.users = options.allowedMentions.users.slice(
          0,
          100
        );
      }
    }

    if (options.allowedMentions.roles?.length) {
      if (
        options.allowedMentions.parse.includes(
          DiscordAllowedMentionsTypes.RoleMentions
        )
      ) {
        options.allowedMentions.parse = options.allowedMentions.parse.filter(
          (p) => p !== "roles"
        );
      }

      if (options.allowedMentions.roles.length > 100) {
        options.allowedMentions.roles = options.allowedMentions.roles.slice(
          0,
          100
        );
      }
    }
  }

  const result = await rest.runMethod(
    "post",
    `${endpoints.WEBHOOK(webhookId, webhookToken)}${
      options.wait ? "?wait=true" : ""
    }`,
    {
      ...options,
      allowed_mentions: options.allowedMentions,
      avatar_url: options.avatarUrl,
    }
  );
  if (!options.wait) return;

  return structures.createDiscordenoMessage(result as DiscordMessage);
}

function DiscordAllowedMentionTypes(DiscordAllowedMentionTypes: any) {
  throw new Error("Function not implemented.");
}

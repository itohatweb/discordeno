import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordGatewayPayload } from "../../types/gateway/gateway_payload.ts";
import { DiscordGuildMemberUpdate } from "../../types/members/guild_member_update.ts";

export async function handleGuildMemberUpdate(data: DiscordGatewayPayload) {
  const payload = data.d as DiscordGuildMemberUpdate;
  const guild = await cacheHandlers.get("guilds", payload.guild_id);
  if (!guild) return;

  const cachedMember = await cacheHandlers.get("members", payload.user.id);
  const guildMember = cachedMember?.guilds.get(payload.guild_id);

  const newMemberData = {
    ...payload,
    // deno-lint-ignore camelcase
    premium_since: payload.premium_since || undefined,
    // deno-lint-ignore camelcase
    joined_at: new Date(guildMember?.joinedAt || Date.now())
      .toISOString(),
    deaf: guildMember?.deaf || false,
    mute: guildMember?.mute || false,
    roles: payload.roles,
  };
  const discordenoMember = await structures.createDiscordenoMember(
    newMemberData,
    payload.guild_id,
  );
  await cacheHandlers.set("members", discordenoMember.id, discordenoMember);

  if (guildMember) {
    if (guildMember.nick !== payload.nick) {
      eventHandlers.nicknameUpdate?.(
        guild,
        discordenoMember,
        payload.nick!,
        guildMember.nick,
      );
    }

    if (payload.pending === false && guildMember.pending === true) {
      eventHandlers.membershipScreeningPassed?.(guild, discordenoMember);
    }

    const roleIds = guildMember.roles || [];

    roleIds.forEach((id) => {
      eventHandlers.debug?.(
        "loop",
        `1. Running forEach loop in GUILD_MEMBER_UPDATE file.`,
      );
      if (!payload.roles.includes(id)) {
        eventHandlers.roleLost?.(guild, discordenoMember, id);
      }
    });

    payload.roles.forEach((id) => {
      eventHandlers.debug?.(
        "loop",
        `2. Running forEach loop in GUILD_MEMBER_UPDATE file.`,
      );
      if (!roleIds.includes(id)) {
        eventHandlers.roleGained?.(guild, discordenoMember, id);
      }
    });
  }

  eventHandlers.guildMemberUpdate?.(guild, discordenoMember, cachedMember);
}

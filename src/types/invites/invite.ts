import { Channel } from "../channels/channel.ts";
import { Guild } from "../guilds/guild.ts";
import { User } from "../users/user.ts";
import { SnakeCasedPropertiesDeep } from "../util.ts";
import { DiscordTargetUserTypes } from "./target_user_types.ts";

export interface Invite {
  /** The invite code (unique Id) */
  code: string;
  /** The guild this invite is for */
  guild?: Partial<Guild>;
  /** The channel this invite is for */
  channel: Partial<Channel>;
  /** The user who created the invite */
  inviter?: User;
  /** The target user for this invite */
  targetUser?: User;
  /** The type of user target for this invite */
  targetUserType?: DiscordTargetUserTypes;
  /** Approximate count of online members (only present when target_user is set) */
  approximatePresenceCount?: number;
  /** Approximate count of total members */
  approximateMemberCount?: number;
}

/** https://discord.com/developers/docs/resources/invite#invite-object */
export type DiscordInvite = SnakeCasedPropertiesDeep<Invite>;

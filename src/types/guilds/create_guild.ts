import { Channel } from "../channels/channel.ts";
import { Role } from "../permissions/role.ts";
import { SnakeCasedPropertiesDeep } from "../util.ts";
import { DiscordDefaultMessageNotificationLevels } from "./default_message_notification_levels.ts";
import { DiscordExplicitContentFilterLevels } from "./explicit_content_filter_levels.ts";
import { DiscordVerificationLevels } from "./verification_levels.ts";

export interface CreateGuild {
  /** Name of the guild (2-100 characters) */
  name: string;
  /** Voice region id */
  region?: string;
  /** Base64 128x128 image for the guild icon */
  icon?: string;
  /** Verification level */
  verificationLevel?: DiscordVerificationLevels;
  /** Default message notification level */
  defaultMessageNotifications?: DiscordDefaultMessageNotificationLevels;
  /** Explicit content filter level */
  explicitContentFilter?: DiscordExplicitContentFilterLevels;
  /** New guild roles (first role is the everyone role) */
  roles?: Role[];
  /** New guild's channels */
  channels?: Partial<Channel>[];
  /** Id for afk channel */
  afkChannelId?: string;
  /** Afk timeout in seconds */
  afkTimeout?: number;
  /** The id of the channel where guild notices such as welcome messages and boost events are posted */
  systemChannelId?: string;
}

/** https://discord.com/developers/docs/resources/guild#create-guild */
export type DiscordCreateGuild = SnakeCasedPropertiesDeep<CreateGuild>;

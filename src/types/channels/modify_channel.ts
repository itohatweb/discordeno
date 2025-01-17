import { SnakeCasedPropertiesDeep } from "../util.ts";
import { DiscordChannelTypes } from "./channel_types.ts";
import { DiscordOverwrite, Overwrite } from "./overwrite.ts";

export interface ModifyChannel {
  /** 2-100 character channel name */
  name?: string;
  /** The type of channel; only conversion between text and news is supported and only in guilds with the "NEWS" feature */
  type?: DiscordChannelTypes;
  /** The position of the channel in the left-hand listing */
  position?: number | null;
  /** 0-1024 character channel topic */
  topic?: string | null;
  /** Whether the channel is nsfw */
  nsfw?: boolean | null;
  /** Amount of seconds a user has to wait before sending another message (0-21600); bots, as well as users with the permission `manage_messages` or `manage_channel`, are unaffected */
  rateLimitPerUser?: number | null;
  /** The bitrate (in bits) of the voice channel; 8000 to 96000 (128000 for VIP servers) */
  bitrate?: number | null;
  /** The user limit of the voice channel; 0 refers to no limit, 1 to 99 refers to a user limit */
  userLimit?: number | null;
  /** Channel or category-specific permissions */
  permissionOverwrites?: Overwrite[] | null;
  /** id of the new parent category for a channel */
  parentId?: string | null;
}

/** https://discord.com/developers/docs/resources/channel#modify-channel */
export interface DiscordModifyChannel extends
  SnakeCasedPropertiesDeep<
    Omit<ModifyChannel, "permissionOverwrites">
  > {
  permission_overwrites?: DiscordOverwrite[];
}

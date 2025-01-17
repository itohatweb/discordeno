import { editMember } from "./edit_member.ts";

/**
 * Move a member from a voice channel to another.
 * @param guildId the id of the guild which the channel exists in
 * @param memberId the id of the member to move.
 * @param channelId id of channel to move user to (if they are connected to voice)
 */
export function moveMember(
  guildId: string,
  memberId: string,
  channelId: string,
) {
  return editMember(guildId, memberId, { channel_id: channelId });
}

import { botId } from "../bot.ts";
import { cacheHandlers } from "../cache.ts";
import { DiscordenoChannel } from "../structures/channel.ts";
import { DiscordenoGuild } from "../structures/guild.ts";
import { DiscordenoMember } from "../structures/member.ts";
import { DiscordenoRole } from "../structures/role.ts";
import { Errors } from "../types/misc/errors.ts";
import { DiscordBitwisePermissionFlags } from "../types/permissions/bitwise_permission_flags.ts";
import { PermissionStrings } from "../types/permissions/permission_strings.ts";

async function getCached(
  table: "guilds",
  key: string | DiscordenoGuild
): Promise<DiscordenoGuild | undefined>;
async function getCached(
  table: "channels",
  key: string | DiscordenoChannel
): Promise<DiscordenoChannel | undefined>;
async function getCached(
  table: "members",
  key: string | DiscordenoMember
): Promise<DiscordenoMember | undefined>;
async function getCached(
  table: "guilds" | "channels" | "members",
  key: string | DiscordenoGuild | DiscordenoChannel | DiscordenoMember
) {
  const cached =
    typeof key === "string"
      ? // @ts-ignore TS is wrong here
        await cacheHandlers.get(table, key)
      : key;
  if (!cached || typeof cached === "string") {
    throw new Error(
      Errors[`${table.slice(0, -1).toUpperCase()}_NOT_FOUND` as Errors]
    );
  }

  return typeof cached === "string" ? undefined : cached;
}

/** Calculates the permissions this member has in the given guild */
export async function calculateBasePermissions(
  guildOrId: string | DiscordenoGuild,
  memberOrId: string | DiscordenoMember
) {
  const guild = await getCached("guilds", guildOrId);
  const member = await getCached("members", memberOrId);

  if (!guild || !member) return "8";

  let permissions = 0n;
  // Calculate the role permissions bits, @everyone role is not in memberRoleIds so we need to pass guildId manualy
  permissions |= [...(member.guilds.get(guild.id)?.roles || []), guild.id]
    .map((id) => (guild as DiscordenoGuild).roles.get(id)?.permissions)
    // Removes any edge case undefined
    .filter((perm) => perm)
    .reduce((bits, perms) => {
      bits |= BigInt(perms);
      return bits;
    }, 0n);

  // If the memberId is equal to the guild ownerId he automatically has every permission so we add ADMINISTRATOR permission
  if (guild.ownerId === member.id) permissions |= 8n;
  // Return the members permission bits as a string
  return permissions.toString();
}

/** Calculates the permissions this member has for the given Channel */
export async function calculateChannelOverwrites(
  channelOrId: string | DiscordenoChannel,
  memberOrId: string | DiscordenoMember
) {
  const channel = await getCached("channels", channelOrId);

  // This is a DM channel so return ADMINISTRATOR permission
  if (!channel?.guildId) return "8";

  const member = await getCached("members", memberOrId);

  if (!member) return "8";

  // Get all the role permissions this member already has
  let permissions = BigInt(
    await calculateBasePermissions(channel.guildId, member)
  );

  // First calculate @everyone overwrites since these have the lowest priority
  const overwriteEveryone = channel?.permissionOverwrites?.find(
    (overwrite) => overwrite.id === (channel as DiscordenoChannel).guildId
  );
  if (overwriteEveryone) {
    // First remove denied permissions since denied < allowed
    permissions &= ~BigInt(overwriteEveryone.deny);
    permissions |= BigInt(overwriteEveryone.allow);
  }

  const overwrites = channel?.permissionOverwrites;

  // In order to calculate the role permissions correctly we need to temporarily save the allowed and denied permissions
  let allow = 0n;
  let deny = 0n;
  const memberRoles = member.guilds.get(channel.guildId)?.roles || [];
  // Second calculate members role overwrites since these have middle priority
  for (const overwrite of overwrites || []) {
    if (!memberRoles.includes(overwrite.id)) continue;

    deny |= BigInt(overwrite.deny);
    allow |= BigInt(overwrite.allow);
  }
  // After role overwrite calculate save allowed permissions first we remove denied permissions since "denied < allowed"
  permissions &= ~deny;
  permissions |= allow;

  // Third calculate member specific overwrites since these have the highest priority
  const overwriteMember = overwrites?.find(
    (overwrite) => overwrite.id === (member as DiscordenoMember).id
  );
  if (overwriteMember) {
    permissions &= ~BigInt(overwriteMember.deny);
    permissions |= BigInt(overwriteMember.allow);
  }

  return permissions.toString();
}

/** Checks if the given permission bits are matching the given permissions. `ADMINISTRATOR` always returns `true` */
export function validatePermissions(
  permissionBits: string,
  permissions: PermissionStrings[]
) {
  if (BigInt(permissionBits) & 8n) return true;

  return permissions.every(
    (permission) =>
      // Check if permission is in permissionBits
      BigInt(permissionBits) & BigInt(DiscordBitwisePermissionFlags[permission])
  );
}

/** Checks if the given member has these permissions in the given guild */
export async function hasGuildPermissions(
  guild: string | DiscordenoGuild,
  member: string | DiscordenoMember,
  permissions: PermissionStrings[]
) {
  // First we need the role permission bits this member has
  const basePermissions = await calculateBasePermissions(guild, member);
  // Second use the validatePermissions function to check if the member has every permission
  return validatePermissions(basePermissions, permissions);
}

/** Checks if the bot has these permissions in the given guild */
export function botHasGuildPermissions(
  guild: string | DiscordenoGuild,
  permissions: PermissionStrings[]
) {
  // Since Bot is a normal member we can use the hasRolePermissions() function
  return hasGuildPermissions(guild, botId, permissions);
}

/** Checks if the given member has these permissions for the given channel */
export async function hasChannelPermissions(
  channel: string | DiscordenoChannel,
  member: string | DiscordenoMember,
  permissions: PermissionStrings[]
) {
  // First we need the overwrite bits this member has
  const channelOverwrites = await calculateChannelOverwrites(channel, member);
  // Second use the validatePermissions function to check if the member has every permission
  return validatePermissions(channelOverwrites, permissions);
}

/** Checks if the bot has these permissions f0r the given channel */
export function botHasChannelPermissions(
  channel: string | DiscordenoChannel,
  permissions: PermissionStrings[]
) {
  // Since Bot is a normal member we can use the hasRolePermissions() function
  return hasChannelPermissions(channel, botId, permissions);
}

/** Returns the permissions that are not in the given permissionBits */
export function missingPermissions(
  permissionBits: string,
  permissions: PermissionStrings[]
) {
  if (BigInt(permissionBits) & 8n) return [];

  return permissions.filter(
    (permission) =>
      !(
        BigInt(permissionBits) &
        BigInt(DiscordBitwisePermissionFlags[permission])
      )
  );
}

/** Get the missing Guild permissions this member has */
export async function getMissingGuildPermissions(
  guild: string | DiscordenoGuild,
  member: string | DiscordenoMember,
  permissions: PermissionStrings[]
) {
  // First we need the role permissino bits this member has
  const permissionBits = await calculateBasePermissions(guild, member);
  // Second returnn the members missing permissions
  return missingPermissions(permissionBits, permissions);
}

/** Get the missing Channel permissions this member has */
export async function getMissingChannelPermissions(
  channel: string | DiscordenoChannel,
  member: string | DiscordenoMember,
  permissions: PermissionStrings[]
) {
  // First we need the role permissino bits this member has
  const permissionBits = await calculateChannelOverwrites(channel, member);
  // Second returnn the members missing permissions
  return missingPermissions(permissionBits, permissions);
}

/** Throws an error if this member has not all of the given permissions */
export async function requireGuildPermissions(
  guild: string | DiscordenoGuild,
  member: string | DiscordenoMember,
  permissions: PermissionStrings[]
) {
  const missing = await getMissingGuildPermissions(guild, member, permissions);
  if (missing.length) {
    // If the member is missing a permission throw an Error
    throw new Error(`Missing Permissions: ${missing.join(" & ")}`);
  }
}

/** Throws an error if the bot does not have all permissions */
export function requireBotGuildPermissions(
  guild: string | DiscordenoGuild,
  permissions: PermissionStrings[]
) {
  // Since Bot is a normal member we can use the throwOnMissingGuildPermission() function
  return requireGuildPermissions(guild, botId, permissions);
}

/** Throws an error if this member has not all of the given permissions */
export async function requireChannelPermissions(
  channel: string | DiscordenoChannel,
  member: string | DiscordenoMember,
  permissions: PermissionStrings[]
) {
  const missing = await getMissingChannelPermissions(
    channel,
    member,
    permissions
  );
  if (missing.length) {
    // If the member is missing a permission throw an Error
    throw new Error(`Missing Permissions: ${missing.join(" & ")}`);
  }
}

/** Throws an error if the bot has not all of the given channel permissions */
export function requireBotChannelPermissions(
  channel: string | DiscordenoChannel,
  permissions: PermissionStrings[]
) {
  // Since Bot is a normal member we can use the throwOnMissingChannelPermission() function
  return requireChannelPermissions(channel, botId, permissions);
}

/** This function converts a bitwise string to permission strings */
export function calculatePermissions(permissionBits: bigint) {
  return Object.keys(DiscordBitwisePermissionFlags).filter((permission) => {
    // Since Object.keys() not only returns the permission names but also the bit values we need to return false if it is a Number
    if (Number(permission)) return false;
    // Check if permissionBits has this permission
    return (
      permissionBits &
      BigInt(DiscordBitwisePermissionFlags[permission as PermissionStrings])
    );
  }) as PermissionStrings[];
}

/** This function converts an array of permissions into the bitwise string. */
export function calculateBits(permissions: PermissionStrings[]) {
  return permissions
    .reduce((bits, perm) => {
      bits |= BigInt(DiscordBitwisePermissionFlags[perm]);
      return bits;
    }, 0n)
    .toString();
}

/** Gets the highest role from the member in this guild */
export async function highestRole(
  guildOrId: string | DiscordenoGuild,
  memberOrId: string | DiscordenoMember
) {
  const guild = await getCached("guilds", guildOrId);

  if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);

  // Get the roles from the member
  const memberRoles = (await getCached("members", memberOrId))?.guilds.get(guild.id)
    ?.roles;
  // This member has no roles so the highest one is the @everyone role
  if (!memberRoles) return guild.roles.get(guild.id)!;

  let memberHighestRole: DiscordenoRole | undefined;

  for (const roleId of memberRoles) {
    const role = guild.roles.get(roleId);
    // Rare edge case handling if undefined
    if (!role) continue;

    // If memberHighestRole is still undefined we want to assign the role,
    // else we want to check if the current role position is higher than the current memberHighestRole
    if (
      !memberHighestRole ||
      memberHighestRole.position < role.position ||
      memberHighestRole.position === role.position
    ) {
      memberHighestRole = role;
    }
  }

  // The member has at least one role so memberHighestRole must exist
  return memberHighestRole!;
}

/** Checks if the first role is higher than the second role */
export async function higherRolePosition(
  guildOrId: string | DiscordenoGuild,
  roleId: string,
  otherRoleId: string
) {
  const guild = await getCached("guilds", guildOrId);

  if (!guild) return true;

  const role = guild.roles.get(roleId);
  const otherRole = guild.roles.get(otherRoleId);
  if (!role || !otherRole) throw new Error(Errors.ROLE_NOT_FOUND);

  // Rare edge case handling
  if (role.position === otherRole.position) {
    return role.id < otherRole.id;
  }

  return role.position > otherRole.position;
}

/** Checks if the member has a higher position than the given role */
export async function isHigherPosition(
  guildOrId: string | DiscordenoGuild,
  memberId: string,
  compareRoleId: string
) {
  const guild = await getCached("guilds", guildOrId);

  if (!guild || guild.ownerId === memberId) return true;

  const memberHighestRole = await highestRole(guild, memberId);
  return higherRolePosition(guild.id, memberHighestRole.id, compareRoleId);
}

import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/misc/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
import { camelKeysToSnakeCase } from "../../util/utils.ts";

/**
 * Begin a prune operation. Requires the KICK_MEMBERS permission. Returns an object with one 'pruned' key indicating the number of members that were removed in the prune operation. For large guilds it's recommended to set the computePruneCount option to false, forcing 'pruned' to null. Fires multiple Guild Member Remove Gateway events.
 * 
 * By default, prune will not remove users with roles. You can optionally include specific roles in your prune by providing the roles (resolved to include_roles internally) parameter. Any inactive user that has a subset of the provided role(s) will be included in the prune and users with additional roles will not.
 */
export async function pruneMembers(
  guildId: string,
  options: PruneOptions,
) {
  if (options.days && options.days < 1) throw new Error(Errors.PRUNE_MIN_DAYS);
  if (options.days && options.days > 30) throw new Error(Errors.PRUNE_MAX_DAYS);

  await requireBotGuildPermissions(guildId, ["KICK_MEMBERS"]);

  const result = await rest.runMethod(
    "post",
    endpoints.GUILD_PRUNE(guildId),
    camelKeysToSnakeCase(options),
  );

  return result;
}

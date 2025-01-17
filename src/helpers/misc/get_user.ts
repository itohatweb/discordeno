import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";

/** This function will return the raw user payload in the rare cases you need to fetch a user directly from the API. */
export async function getUser(userId: string) {
  const result = await rest.runMethod("get", endpoints.USER(userId));

  return result as UserPayload;
}

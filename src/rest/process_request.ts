import { BASE_URL } from "../util/constants.ts";
import { rest } from "./rest.ts";

/** Processes a request and assigns it to a queue or creates a queue if none exists for it. */
export async function processRequest(
  request: ServerRequest,
  payload: RunMethodOptions
) {
  const route = request.url.substring(request.url.indexOf("api/"));
  const parts = route.split("/");
  // REMOVE THE API
  parts.shift();
  // REMOVES THE VERSION NUMBER
  if (parts[0]?.startsWith("v")) parts.shift();
  // SET THE NEW REQUEST URL
  request.url = `${BASE_URL}/v${rest.apiVersion}/${parts.join("/")}`;
  // REMOVE THE MAJOR PARAM
  parts.shift();

  const [id] = parts;

  const queue = rest.pathQueues.get(id);
  // IF THE QUEUE EXISTS JUST ADD THIS TO THE QUEUE
  if (queue) {
    queue.push({ request, payload });
  } else {
    // CREATES A NEW QUEUE
    rest.pathQueues.set(id, [
      {
        request,
        payload,
      },
    ]);
    await rest.processQueue(id);
  }
}

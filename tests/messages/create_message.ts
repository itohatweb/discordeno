import { cache, delay, sendMessage } from "../../mod.ts";
import { defaultTestOptions, tempData } from "../ws/start_bot.ts";
import { assertExists } from "../deps.ts";

async function ifItFailsBlameWolf(type: "getter" | "raw") {
  let message;
  if (type === "raw") {
    message = await sendMessage(tempData.channelId, "Hello World!");
  } else {
    const channel = await cache.channels.get(tempData.channelId);

    assertExists(channel);

    message = await channel.send("Hello World!");
  }

  // Assertions
  assertExists(message);

  // Delay the execution by 5 seconds to allow MESSAGE_CREATE event to be processed
  await delay(5000);

  if (!cache.messages.has(message.id)) {
    throw new Error(
      "The message seemed to be sent but it was not cached.",
    );
  }
}

Deno.test({
  name: "[message] send a new message",
  async fn() {
    await ifItFailsBlameWolf("raw");
  },
  ...defaultTestOptions,
});

Deno.test({
  name: "[message] channel.send()",
  async fn() {
    await ifItFailsBlameWolf("getter");
  },
  ...defaultTestOptions,
});
import { encode } from "../../deps.ts";
import { eventHandlers } from "../bot.ts";
import { DiscordGatewayOpcodes } from "../types/codes/gateway_opcodes.ts";
import { StatusUpdate } from "../types/gateway/status_update.ts";
import { DiscordApplicationCommandOptionTypes } from "../types/interactions/application_command_option_types.ts";
import { Errors } from "../types/misc/errors.ts";
import { DiscordImageFormat } from "../types/misc/image_format.ts";
import { DiscordImageSize } from "../types/misc/image_size.ts";
import { ws } from "../ws/ws.ts";
import { SLASH_COMMANDS_NAME_REGEX } from "./constants.ts";

// TODO: move this function to helpers
export function editBotStatus(
  data: Omit<StatusUpdate, "afk" | "since">,
) {
  ws.shards.forEach((shard) => {
    eventHandlers.debug?.(
      "loop",
      `Running forEach loop in editBotStatus function.`,
    );
    shard.ws.send(
      JSON.stringify({
        op: DiscordGatewayOpcodes.StatusUpdate,
        d: {
          since: null,
          afk: false,
          ...data,
        },
      }),
    );
  });
}

export async function urlToBase64(url: string) {
  const buffer = await fetch(url).then((res) => res.arrayBuffer());
  const imageStr = encode(buffer);
  const type = url.substring(url.lastIndexOf(".") + 1);
  return `data:image/${type};base64,${imageStr}`;
}

/** Allows easy way to add a prop to a base object when needing to use complicated getters solution. */
// deno-lint-ignore no-explicit-any
export function createNewProp(value: any): PropertyDescriptor {
  return { configurable: true, enumerable: true, writable: true, value };
}

export function delay(ms: number): Promise<void> {
  return new Promise((res): number =>
    setTimeout((): void => {
      res();
    }, ms)
  );
}

export const formatImageURL = (
  url: string,
  size: DiscordImageSize = 128,
  format?: DiscordImageFormat,
) => {
  return `${url}.${format ||
    (url.includes("/a_") ? "gif" : "jpg")}?size=${size}`;
};

function camelToSnakeCase(text: string) {
  return text.replace(/[A-Z]/g, ($1) => `_${$1.toLowerCase()}`);
}

function snakeToCamelCase(text: string) {
  return text.replace(
    /([-_][a-z])/gi,
    ($1) => $1.toUpperCase().replace("_", ""),
  );
}

function isObject(obj: unknown) {
  return (
    obj === Object(obj) && !Array.isArray(obj) && typeof obj !== "function"
  );
}

export function camelKeysToSnakeCase<T>(
  // deno-lint-ignore no-explicit-any
  obj: Record<string, any> | Record<string, any>[],
): T {
  if (isObject(obj)) {
    // deno-lint-ignore no-explicit-any
    const convertedObject: Record<string, any> = {};

    Object.keys(obj).forEach((key) => {
      eventHandlers.debug?.(
        "loop",
        `Running forEach loop in camelKeysToSnakeCase function.`,
      );
      convertedObject[camelToSnakeCase(key)] = camelKeysToSnakeCase(
        (obj as Record<string, any>)[key],
      );
    });

    return convertedObject as T;
  } else if (Array.isArray(obj)) {
    obj = obj.map((element) => camelKeysToSnakeCase(element));
  }

  return obj as T;
}

export function snakeKeysToCamelCase<T>(
  // deno-lint-ignore no-explicit-any
  obj: Record<string, any> | Record<string, any>[],
): T {
  if (isObject(obj)) {
    // deno-lint-ignore no-explicit-any
    const convertedObject: Record<string, any> = {};

    Object.keys(obj).forEach((key) => {
      eventHandlers.debug?.(
        "loop",
        `Running forEach loop in snakeKeysToCamelCase function.`,
      );
      convertedObject[snakeToCamelCase(key)] = snakeKeysToCamelCase(
        (obj as Record<string, any>)[key],
      );
    });

    return convertedObject as T;
  } else if (Array.isArray(obj)) {
    obj = obj.map((element) => snakeKeysToCamelCase(element));
  }

  return obj as T;
}

/** @private */
function validateSlashOptionChoices(
  choices: SlashCommandOptionChoice[],
  optionType: DiscordApplicationCommandOptionTypes,
) {
  for (const choice of choices) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in validateSlashOptionChoices function.`,
    );
    if ([...choice.name].length < 1 || [...choice.name].length > 100) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }

    if (
      (optionType === DiscordApplicationCommandOptionTypes.STRING &&
        (typeof choice.value !== "string" ||
          choice.value.length < 1 ||
          choice.value.length > 100)) ||
      (optionType === DiscordApplicationCommandOptionTypes.INTEGER &&
        typeof choice.value !== "number")
    ) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }
  }
}

/** @private */
function validateSlashOptions(options: SlashCommandOption[]) {
  for (const option of options) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in validateSlashOptions function.`,
    );
    if (
      option.choices?.length &&
      (option.choices.length > 25 ||
        (option.type !== DiscordApplicationCommandOptionTypes.STRING &&
          option.type !== DiscordApplicationCommandOptionTypes.INTEGER))
    ) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }

    if (
      [...option.name].length < 1 ||
      [...option.name].length > 32 ||
      [...option.description].length < 1 ||
      [...option.description].length > 100
    ) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }

    if (option.choices) {
      validateSlashOptionChoices(option.choices, option.type);
    }
  }
}

export function validateSlashCommands(
  commands: UpsertSlashCommandOptions[],
  create = false,
) {
  for (const command of commands) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in validateSlashCommands function.`,
    );
    if (
      (command.name && !SLASH_COMMANDS_NAME_REGEX.test(command.name)) ||
      (create && !command.name)
    ) {
      throw new Error(Errors.INVALID_SLASH_NAME);
    }

    if (
      (command.description &&
        ([...command.description].length < 1 ||
          [...command.description].length > 100)) ||
      (create && !command.description)
    ) {
      throw new Error(Errors.INVALID_SLASH_DESCRIPTION);
    }

    if (command.options?.length) {
      if (command.options.length > 25) {
        throw new Error(Errors.INVALID_SLASH_OPTIONS);
      }

      validateSlashOptions(command.options);
    }
  }
}

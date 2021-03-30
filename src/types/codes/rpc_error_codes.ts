/** https://discord.com/developers/docs/topics/opcodes-and-status-codes#rpc */
export enum DiscordRpcErrorCodes {
  UnknownError = 1000,
  InvalidPayload = 4000,
  InvalidCommand = 4002,
  InvalidGuild,
  InvalidEvent,
  InvalidChannel,
  InvalidPermissions,
  InvalidClientID,
  InvalidOrigin,
  InvalidToken,
  InvalidUser,
  OAuth2Error = 5000,
  SelectChannelTimedOut,
  GetGuildTimedOut,
  SelectVoiceForceRequired,
  CaptureShortcutAlreadyListening,
}

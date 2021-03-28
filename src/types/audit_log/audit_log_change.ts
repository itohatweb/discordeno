import { SnakeCaseProps } from "../util.ts";
import { AuditLogChangeValue } from "./audit_log_change_value.ts";

export interface AuditLogChange {
  /** New value of the key */
  newValue?: AuditLogChangeValue;
  /** Old value of the key */
  oldValue?: AuditLogChangeValue;
  /** Name of audit log change key */
  key: string;
}

/** https://discord.com/developers/docs/resources/audit-log#audit-log-change-object-audit-log-change-structure */
export type DiscordAuditLogChange = SnakeCaseProps<AuditLogChange>;

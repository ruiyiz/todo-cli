export type Priority = "none" | "low" | "medium" | "high";

export interface GlobalOptions {
  json?: boolean;
  plain?: boolean;
  quiet?: boolean;
  noColor?: boolean;
  noInput?: boolean;
}

export type OutputFormat = "json" | "plain" | "pretty";

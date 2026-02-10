export type Priority = "normal" | "prioritized";

export interface GlobalOptions {
  json?: boolean;
  plain?: boolean;
  quiet?: boolean;
  noColor?: boolean;
  noInput?: boolean;
}

export type OutputFormat = "json" | "plain" | "pretty";

import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface Theme {
  accent: string;
  accentFg: string;
  selection: string;
  danger: string;
  success: string;
  priority: string;
}

const defaults: Theme = {
  accent: "#1e3a5f",
  accentFg: "white",
  selection: "yellow",
  danger: "red",
  success: "green",
  priority: "yellow",
};

function loadTheme(): Theme {
  try {
    const configPath = join(homedir(), ".config", "todo", "theme.json");
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export const theme: Theme = loadTheme();

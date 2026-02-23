import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface TursoConfig {
  url?: string;
  authToken?: string;
}

function loadConfigFile(): TursoConfig {
  const configPath = join(homedir(), ".config", "todo", "config.json");
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      url: parsed?.turso?.url,
      authToken: parsed?.turso?.authToken,
    };
  } catch {
    return {};
  }
}

export function getTursoConfig(): TursoConfig {
  const file = loadConfigFile();
  return {
    url: process.env.TURSO_DATABASE_URL ?? file.url,
    authToken: process.env.TURSO_AUTH_TOKEN ?? file.authToken,
  };
}

export function isRemoteEnabled(): boolean {
  const { url, authToken } = getTursoConfig();
  return !!(url && authToken);
}

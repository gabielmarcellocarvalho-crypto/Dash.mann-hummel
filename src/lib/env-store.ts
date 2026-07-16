import fs from "node:fs";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env.local");

// Alguns provedores (MELI) rotacionam o refresh_token a cada uso — o valor
// novo precisa sobrescrever o .env.local ou a próxima renovação falha.
export function upsertEnvVar(key: string, value: string): void {
  process.env[key] = value;

  if (!fs.existsSync(ENV_PATH)) return;

  const content = fs.readFileSync(ENV_PATH, "utf8");
  const lineRegex = new RegExp(`^${key}=.*$`, "m");
  const nextContent = lineRegex.test(content)
    ? content.replace(lineRegex, `${key}=${value}`)
    : `${content}${content.endsWith("\n") || content === "" ? "" : "\n"}${key}=${value}\n`;

  fs.writeFileSync(ENV_PATH, nextContent, "utf8");
}

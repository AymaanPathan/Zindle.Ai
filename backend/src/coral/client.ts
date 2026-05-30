import { execSync } from "child_process";
import { coralSql } from "./mcp"; // ← delegate to the singleton

const CORAL_PATH: string = (() => {
  const env = process.env.CORAL_PATH;
  if (env) return env;
  try {
    return execSync("which coral").toString().trim();
  } catch {
    return "coral";
  }
})();

console.log(`[Coral] CORAL_PATH resolved to: ${CORAL_PATH}`);

export async function runCoralQuery<T = any>(query: string): Promise<T> {
  return coralSql(query) as Promise<T>;
}
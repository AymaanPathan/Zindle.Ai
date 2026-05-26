import execa from "execa";
import { execSync } from "child_process";


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
  try {
    const { stdout } = await execa(
      CORAL_PATH,
      ["sql", "--format", "json", query],   
      {
        reject: true,         
        stripFinalNewline: true,
      }
    );

    const trimmed = stdout.trim();

    if (!trimmed) return [] as unknown as T;

    return JSON.parse(trimmed) as T;

  } catch (error: any) {
    console.error("❌ Coral query failed");
    console.error("STDERR:", error?.stderr);
    console.error("MESSAGE:", error?.message);
    throw new Error(`Coral query execution failed: ${error?.stderr ?? error?.message}`);
  }
}
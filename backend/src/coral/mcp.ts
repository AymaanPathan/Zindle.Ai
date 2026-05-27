import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { execSync } from "child_process";

const CORAL_PATH = process.env.CORAL_PATH || (() => {
  try { return execSync("which coral").toString().trim(); }
  catch { return "coral"; }
})();

console.log(`[MCP] CORAL_PATH: ${CORAL_PATH}`);

// ─── Persistent singleton client ──────────────────────────────────────────────
// Previously: spawn → init → query → kill  (for EVERY query — cold start cost every time)
// Now:        spawn → init ONCE → reuse forever → auto-reconnect on crash

type PendingRequest = {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
};
  
class CoralMcpClient {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private initialized = false;
  private initializing = false;
  private reqId = 10; // start above 1 so init IDs never collide
  private buffer = "";
  private pending = new Map<number, PendingRequest>();

  // ── Internal: read stdout and dispatch to waiting promises ─────────────────
  private handleData(chunk: Buffer): void {
    this.buffer += chunk.toString();
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      let msg: any;
      try { msg = JSON.parse(line); } catch { continue; }

      const p = this.pending.get(msg.id);
      if (!p) continue;
      clearTimeout(p.timer);
      this.pending.delete(msg.id);

      if (msg.error) p.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  }

  // ── Internal: send one JSON-RPC request and await its response ──────────────
  private sendRaw(req: object, timeoutMs = 20_000): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = (req as any).id;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP timeout (id=${id})`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.proc!.stdin.write(JSON.stringify(req) + "\n");
      console.log(`[MCP] → id=${id} method=${(req as any).method}`);
    });
  }

  // ── Internal: boot process and run initialize handshake ────────────────────
  private async boot(): Promise<void> {
    if (this.proc && !this.proc.killed) {
      this.proc.kill();
    }

    this.initialized = false;
    this.pending.clear();
    this.buffer = "";

    this.proc = spawn(CORAL_PATH, ["mcp-stdio"], { stdio: ["pipe", "pipe", "pipe"] });

    this.proc.stdout.on("data", (c: Buffer) => this.handleData(c));
    this.proc.stderr.on("data", (d: Buffer) => console.error("[MCP:stderr]", d.toString().trimEnd()));

    this.proc.on("error", (err) => {
      console.error("[MCP] spawn error:", err.message);
      this.rejectAll(new Error(`Coral process error: ${err.message}`));
      this.initialized = false;
    });

    this.proc.on("exit", (code, signal) => {
      console.warn(`[MCP] process exited code=${code} signal=${signal}`);
      this.rejectAll(new Error(`Coral process exited (code=${code})`));
      this.initialized = false;
    });

    // MCP initialize handshake
    await this.sendRaw({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "collections-assistant", version: "2.0" },
      },
    });

    this.proc.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"
    );

    this.initialized = true;
    console.log("[MCP] ✅ Coral process initialized and ready");
  }

  private rejectAll(err: Error): void {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  // ── Public: get (or create) a live process ─────────────────────────────────
  async getClient(): Promise<this> {
    if (this.initialized && this.proc && !this.proc.killed) return this;

    // Prevent concurrent initialization races
    if (this.initializing) {
      await new Promise<void>((res) => {
        const check = setInterval(() => {
          if (!this.initializing) { clearInterval(check); res(); }
        }, 50);
      });
      return this;
    }

    this.initializing = true;
    try {
      await this.boot();
    } finally {
      this.initializing = false;
    }
    return this;
  }

  // ── Public: run a SQL query ────────────────────────────────────────────────
  async sql(query: string): Promise<any[]> {
    await this.getClient();
    const id = this.reqId++;
    console.log(`\n[CoralSQL] id=${id}\n${query.slice(0, 300)}`);

    const result = await this.sendRaw({
      jsonrpc: "2.0", id, method: "tools/call",
      params: { name: "sql", arguments: { sql: query } },
    });

    return parseResult(result, `sql:${id}`);
  }

  // ── Public: run multiple queries over the same live connection ─────────────
  async multiSql(queries: Record<string, string>): Promise<Record<string, any[]>> {
    await this.getClient();
    const results: Record<string, any[]> = {};

    // Run sequentially (Coral MCP is stateful — safer than concurrent)
    for (const [key, query] of Object.entries(queries)) {
      const id = this.reqId++;
      console.log(`\n[CoralMulti:${key}] id=${id}\n${query.slice(0, 200)}`);
      const result = await this.sendRaw({
        jsonrpc: "2.0", id, method: "tools/call",
        params: { name: "sql", arguments: { sql: query } },
      });
      results[key] = parseResult(result, key);
      console.log(`[CoralMulti:${key}] ✅ ${results[key].length} rows`);
    }
    return results;
  }

  // ── Public: list all available tables ─────────────────────────────────────
  async listTables(): Promise<string> {
    await this.getClient();
    const id = this.reqId++;
    const result = await this.sendRaw({
      jsonrpc: "2.0", id, method: "tools/call",
      params: { name: "list_catalog", arguments: {} },
    });
    return result?.content?.[0]?.text ?? JSON.stringify(result);
  }
}

// ── Parse Coral's JSON-in-text response format ─────────────────────────────

function parseResult(result: any, label: string): any[] {
  // Try content[0].text first (standard MCP response)
  const raw = result?.content?.[0]?.text 
    ?? result?.content?.[0] 
    ?? result?.content 
    ?? result;

  if (typeof raw === "string") {
    // Coral sometimes returns CSV-like or has a wrapper object — strip it
    const trimmed = raw.trim();
    
    // Try direct JSON parse
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed?.rows && Array.isArray(parsed.rows)) return parsed.rows;
      if (parsed?.data && Array.isArray(parsed.data)) return parsed.data;
      // Single object result
      if (typeof parsed === "object" && parsed !== null) return [parsed];
    } catch {
      // Try extracting JSON array from within the string
      // Coral sometimes prepends status text before the JSON
      const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      // Try extracting JSON object
      const objMatch = trimmed.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          const parsed = JSON.parse(objMatch[0]);
          if (parsed?.rows && Array.isArray(parsed.rows)) return parsed.rows;
          if (parsed?.data && Array.isArray(parsed.data)) return parsed.data;
          return [parsed];
        } catch {}
      }
      console.warn(`[MCP:parse:${label}] JSON parse failed — raw:`, trimmed.slice(0, 200));
      return [{ raw }];
    }
  }

  if (Array.isArray(raw)) return raw;
  return [];
}
// ── Singleton instance — one process for the lifetime of the server ──────────
const coral = new CoralMcpClient();

// Graceful shutdown
process.on("exit", () => {
  try { (coral as any).proc?.kill(); } catch {}
});

// ── Public API ────────────────────────────────────────────────────────────────

export async function coralSql(query: string): Promise<any[]> {
  return coral.sql(query);
}

export async function coralMultiSql(queries: Record<string, string>): Promise<Record<string, any[]>> {
  return coral.multiSql(queries);
}

export async function coralListTables(): Promise<string> {
  return coral.listTables();
}
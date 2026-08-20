// Per-client setup guides for Pare's MCP server, rendered at /mcp/<slug>.
//
// Why these are separate public pages: "connect Claude Desktop to my bank
// statements" and "personal finance MCP server" are real searches with almost
// no good answers, and the MCP server is Pare's strongest differentiator. One
// combined /mcp page can't rank for each client's query. Same shape as
// lib/bank-guides.ts — a data module two surfaces read.
//
// PATHS HERE ARE GENERIC PLACEHOLDERS ON PURPOSE. The gated /connect page
// computes the machine's real absolute paths per request (process.cwd(),
// process.execPath, PARE_DB_PATH) so the snippet is copy-paste ready. These
// pages are public and must never carry a real home path — same privacy rule
// as the starter taxonomy. Point people at /connect for the filled-in version.
//
// Config shapes verified against app/connect/page.tsx (the source of truth):
// Claude Code takes `cwd`; Claude Desktop has no `cwd` field, so its command
// must be wrapped in a shell `cd` or migrations resolve against the wrong
// directory.

export type ClientKind = "self-host" | "hosted";

export interface McpClient {
  /** URL segment for /mcp/<slug>. Stable — changing one breaks a live URL. */
  slug: string;
  /** Display name, as the vendor brands it. */
  client: string;
  kind: ClientKind;
  /** Sentence under the H1, and the meta description. */
  intro: string;
  /** Where the config lives, shown as a label above the snippet. */
  configPath?: string;
  /** The config snippet, with placeholder paths. */
  config?: string;
  /** Ordered setup steps. */
  steps: string[];
  /** The honest caveat for this client. */
  note: string;
}

const PLACEHOLDER_ROOT = "/path/to/pare";

export const MCP_CLIENTS: McpClient[] = [
  {
    slug: "claude-code",
    client: "Claude Code",
    kind: "self-host",
    intro:
      "Claude Code reads MCP servers from ~/.claude.json. Add Pare under mcpServers at user scope and it's available in every project.",
    configPath: "~/.claude.json",
    config: `{
  "mcpServers": {
    "pare-finance": {
      "command": "/path/to/node",
      "args": ["${PLACEHOLDER_ROOT}/node_modules/tsx/dist/cli.mjs", "${PLACEHOLDER_ROOT}/mcp/server.ts"],
      "cwd": "${PLACEHOLDER_ROOT}",
      "env": { "PARE_DB_PATH": "${PLACEHOLDER_ROOT}/data/pare.db" }
    }
  }
}`,
    steps: [
      "Clone and install Pare, then run it once so the database exists.",
      "Open ~/.claude.json and add the server under mcpServers (create the key if it isn't there).",
      "Replace the placeholder paths with real absolute ones — Pare's /connect page prints them filled in for your machine.",
      "Restart Claude Code. Run /mcp and pare-finance should be listed.",
    ],
    note:
      "cwd must stay the repo root — database migrations resolve relative to the working directory, so a server started elsewhere will look for a database that isn't there.",
  },
  {
    slug: "claude-desktop",
    client: "Claude Desktop",
    kind: "self-host",
    intro:
      "Claude Desktop's config has no cwd field, so the command is wrapped in a shell cd. Everything else matches the Claude Code setup.",
    configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    config: `{
  "mcpServers": {
    "pare-finance": {
      "command": "/bin/sh",
      "args": ["-c", "cd '${PLACEHOLDER_ROOT}' && exec '/path/to/node' '${PLACEHOLDER_ROOT}/node_modules/tsx/dist/cli.mjs' '${PLACEHOLDER_ROOT}/mcp/server.ts'"],
      "env": { "PARE_DB_PATH": "${PLACEHOLDER_ROOT}/data/pare.db" }
    }
  }
}`,
    steps: [
      "Clone and install Pare, then run it once so the database exists.",
      "Open the config file listed under Configuration below (Settings → Developer → Edit Config opens it for you).",
      "Add the server under mcpServers, replacing the placeholder paths with real absolute ones.",
      "Restart Claude Desktop. The tools appear under the connectors menu.",
    ],
    note:
      "The shell wrapper isn't decoration. Claude Desktop can't set a working directory, and Pare's migrations resolve via the working directory — without the cd the server starts against the wrong path and finds no database.",
  },
  {
    slug: "claude-web",
    client: "Claude.ai",
    kind: "hosted",
    intro:
      "Hosted Pare exposes a remote MCP connector over OAuth, so Claude on the web and in the mobile apps can reach your account with no local setup at all.",
    steps: [
      "Sign in to your hosted Pare account at pare.money.",
      "In Claude, open Settings → Connectors → Add custom connector.",
      "Enter https://pare.money/api/mcp as the server URL.",
      "Authorise the connection when Claude redirects you to Pare, and approve the scopes.",
      "The Pare tools are now available in any conversation.",
    ],
    note:
      "This is the one setup where your data leaves your machine — it's the hosted service, so Pare holds the database and Claude reaches it over the network. If you want the data to stay local, use the self-hosted stdio setup with Claude Desktop or Claude Code instead. You can revoke the connection any time from Pare's profile page.",
  },
  {
    slug: "any-mcp-client",
    client: "Any MCP client",
    kind: "self-host",
    intro:
      "Pare's server speaks standard MCP over stdio, so any compliant client can run it — Cursor, Zed, Continue, or something you wrote yourself.",
    config: `command: /path/to/node
args:    ${PLACEHOLDER_ROOT}/node_modules/tsx/dist/cli.mjs ${PLACEHOLDER_ROOT}/mcp/server.ts
cwd:     ${PLACEHOLDER_ROOT}
env:     PARE_DB_PATH=${PLACEHOLDER_ROOT}/data/pare.db`,
    steps: [
      "Clone and install Pare, then run it once so the database exists.",
      "Point your client at the command under Configuration below, however it expects servers to be declared.",
      "Set the working directory to the repo root, or wrap the command in a shell cd if your client can't set one.",
      "Set PARE_DB_PATH to the absolute database path — the server can't guess it when the client launches it.",
    ],
    note:
      "The two things that break setups, in order: a working directory that isn't the repo root, and an unset PARE_DB_PATH. Both produce a server that starts cleanly and then reports no data.",
  },
];

export function getMcpClient(slug: string): McpClient | undefined {
  return MCP_CLIENTS.find((c) => c.slug === slug);
}

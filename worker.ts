// Cloudflare Worker entrypoint (hosted target).
//
// @opennextjs/cloudflare compiles the Next.js app to `.open-next/worker.js`,
// whose DEFAULT export is the fetch handler. Cloudflare also requires every
// Durable Object class the Worker uses to be EXPORTED from the same entry module
// (this is the documented OpenNext convention — its own cache DOs, DOQueueHandler
// etc., are re-exported from the generated worker exactly this way). So this
// wrapper:
//   1. re-exports OpenNext's fetch handler as the default export, and
//   2. exports `UserDataObject`, the per-user data Durable Object that
//      wrangler.toml's `[[durable_objects.bindings]] class_name` reserves.
//
// wrangler.toml's `main` points here instead of straight at the generated
// worker, so both the app handler and the DO class are registered.
//
// The DO class binds the real `cloudflare:workers` DurableObject base (only
// available in the Workers runtime / build) around the runtime-agnostic
// UserDataObject implementation in lib/repo/user-data-object.ts. Keeping the base
// import out of that lib file means the rest of the app (and Node tests) never
// try to resolve the `cloudflare:workers` virtual module.

// @ts-expect-error — resolved by the wrangler/OpenNext build, not by tsc/Node.
import { DurableObject } from "cloudflare:workers";
import { UserDataObject as UserDataImpl } from "./lib/repo/user-data-object";
import type { AnyRepoCall } from "./lib/repo/repo-rpc";

// OpenNext's generated default export is `{ fetch }`. To run a Cloudflare Queue
// consumer on the SAME Worker, the `queue` handler must be a property of the
// default export object alongside `fetch` (the documented OpenNext custom-worker
// pattern — a `queue`/`scheduled` handler can't be a separate top-level export;
// the runtime only looks at the default export's methods). So we import OpenNext's
// handler, re-export its `fetch`, and add our P4 queue consumer.
// `.open-next/worker.js` exists only after `opennextjs-cloudflare build`, so
// this import may or may not resolve depending on build order — @ts-ignore
// (not @ts-expect-error) because a plain `next build` run AFTER a cf:build
// finds the file and would flag the expect-error as unused.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import openNextHandler from "./.open-next/worker.js";
import * as Sentry from "@sentry/cloudflare";
import { sentryOptions } from "./lib/sentry";

// BRANCH SPLIT — READ BEFORE EDITING. This file is a MATCHED PAIR with
// wrangler.toml, and the two branches carry different versions of both ON
// PURPOSE:
//
//   main             — trimmed config (no queues/containers/D1), so this entry
//                      module omits `queue`, `email`, and the ParserContainer
//                      export. A fork or throwaway preview deploys on the
//                      Cloudflare Free plan with no provisioned resources.
//   deploy/full-app  — the full data plane. Its worker.ts carries `queue` +
//                      `email` + `export { ParserContainer }`, matching its
//                      wrangler.toml [[queues]] / [[containers]] blocks.
//
// So DON'T "restore" the missing handlers here to make the branches match:
// exporting a Durable Object class that this branch's wrangler.toml never
// declares breaks the deploy. Change the config and the entry module together,
// on the branch that owns them. (An earlier version of this note claimed the
// full handler "lives on main" — it doesn't, and that error is what let the
// two branches drift apart unnoticed.)
//
// Everything else — lib/, components/, app/, the queue CONSUMER itself — is
// shared and must stay identical on both branches.
const handler = {
  // The Next.js app's fetch handler, untouched.
  fetch: (openNextHandler as { fetch: (...args: unknown[]) => Promise<Response> }).fetch,

  // Daily SimpleFIN sync (wrangler `[triggers] crons`). Same env-parameter
  // discipline as the queue consumer: everything resolves off `env` (D1 via
  // env.DB, the per-user DO namespace via env.USER_DATA) — getCloudflareContext
  // is not reliably available inside a scheduled() invocation. Without a cron
  // trigger configured this handler simply never runs, so deploys whose
  // wrangler config has no [triggers] (e.g. the trimmed one) are unaffected.
  // NOTE for the deploy/full-app merge: that branch's worker.ts also carries
  // `queue` + `email` handlers — keep all three side by side there.
  async scheduled(_event: unknown, env: unknown) {
    const { scheduledSimplefinSync } = await import("./cloud/simplefin/scheduled");
    await scheduledSimplefinSync(env as never);
  },
};

// PHASE 4 — error tracking. withSentry wraps BOTH the fetch and queue handlers,
// capturing unhandled errors with request context. The options come from the
// per-Worker env (SENTRY_DSN secret); when it's unset, Sentry is a no-op (nothing
// sent), so dev/self-host/un-provisioned deploys behave exactly as before. PII is
// stripped in lib/sentry.ts's beforeSend. The Durable Object classes are exported
// separately below and are unaffected by the wrap.
export default Sentry.withSentry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (env: any) => sentryOptions(env),
  handler
);

// (WAITLIST LAUNCH: the `ParserContainer` export is omitted here — no [[containers]]
// in the trimmed wrangler.toml. Restore it with the queue handler for the full app.)

// The registered Durable Object. Extends the Workers DurableObject base (so the
// platform recognises it as a DO with storage + an input gate) and delegates all
// data work to UserDataImpl, which owns the SqliteRepo/DoBackend over ctx.storage.
// One instance per user (the Worker addresses it by id derived from userId), so
// tenant isolation is by construction.
export class UserDataObject extends DurableObject {
  private impl: UserDataImpl;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(ctx: any, env: any) {
    super(ctx, env);
    this.impl = new UserDataImpl(ctx, env);
  }

  // RPC method called on the DO stub by the request-side DoRepoClient transport
  // (lib/repo/index.ts: `stub.call(call)`). The envelope is structured-clone-safe.
  async call(req: AnyRepoCall): Promise<unknown> {
    return this.impl.call(req);
  }

  // Account-deletion RPC: hard-delete this user's entire database (drop all SQL
  // tables/views + clear KV storage). Called by destroyUserData() via the stub.
  // Idempotent.
  async destroy(): Promise<void> {
    return this.impl.destroy();
  }
}

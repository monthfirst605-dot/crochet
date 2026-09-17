// Minimal OpenNext config for Cloudflare Workers. Defaults are fine for this
// app — no KV/R2 bindings are declared here because the app talks to R2
// over the S3 API (see src/lib/storage.ts), not via a Worker binding.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();

/**
 * Entry point for an application built with concepts + synchronizations.
 * Requires the Requesting concept as a bootstrap concept.
 * Please run "deno run import" or "generate_imports.ts" to prepare "@concepts".
 */
import * as concepts from "@concepts";

// Use the following line instead to run against the test database, which resets each time.
// import * as concepts from "@test-concepts";

const { Engine } = concepts;
import { Logging } from "@engine";
import { startRequestingServer } from "@concepts/Requesting/RequestingConcept.ts";
import syncs from "@syncs";

/**
 * Available logging levels:
 *   Logging.OFF
 *   Logging.TRACE - display a trace of the actions.
 *   Logging.VERBOSE - display full record of synchronization.
 */
Engine.logging = Logging.TRACE;

// Register synchronizations
Engine.register(syncs);

// Informative startup log for email configuration
try {
  type EnvGetter = (key: string) => string | undefined;
  const denoEnv = (
    globalThis as unknown as {
      Deno?: { env?: { get?: EnvGetter } };
    }
  ).Deno?.env;
  const envGet: EnvGetter | undefined = denoEnv?.get?.bind(denoEnv);
  const hasSMTP = !!(
    envGet &&
    envGet("SMTP_HOST") &&
    envGet("SMTP_USERNAME") &&
    envGet("SMTP_PASSWORD")
  );
  if (hasSMTP) {
    console.log("📧 Email sending: ENABLED (SMTP)");
  } else {
    console.log("📧 Email sending: DISABLED (configure SMTP_*)");
  }
} catch (_) {
  // ignore if env access unavailable
}

// Start a server to provide the Requesting concept with external/system actions.
startRequestingServer(concepts);

// Optional background cleanup: periodically delete expired postings.
// Configure interval via CLEANUP_INTERVAL_MINUTES (default: 60). Set to 0 to disable.
try {
  type EnvGetter = (key: string) => string | undefined;
  const denoEnv = (
    globalThis as unknown as {
      Deno?: { env?: { get?: EnvGetter } };
    }
  ).Deno?.env;
  const envGet: EnvGetter | undefined = denoEnv?.get?.bind(denoEnv);
  const minutesRaw = envGet ? envGet("CLEANUP_INTERVAL_MINUTES") : undefined;
  const minutes = minutesRaw ? parseInt(minutesRaw, 10) : 60;
  if (!Number.isNaN(minutes) && minutes > 0) {
    const intervalMs = minutes * 60 * 1000;
    const runCleanup = async () => {
      try {
        const now = new Date();
        const { resourceIDs } =
          await concepts.TimeBoundedResource.listExpiredResources({ now });
        if (resourceIDs.length === 0) {
          return;
        }
        let deleted = 0;
        for (const resource of resourceIDs) {
          try {
            await concepts.TimeBoundedResource.deleteTimeWindow({ resource });
          } catch (_) {
            // best-effort; may have been deleted or never existed
          }
          try {
            const intent = await concepts.ResourceIntent.getIntent({
              resource,
            });
            if (intent) {
              await concepts.ResourceIntent.clearIntent({ resource });
            }
          } catch (_) {
            // ignore intent cleanup failures; not critical for deletion
          }
          try {
            await concepts.Resource.deleteResource({ resourceID: resource });
            deleted += 1;
          } catch (_) {
            // resource might have been deleted concurrently
          }
        }
        if (deleted > 0) {
          console.log(
            `🧹 Cleanup: deleted ${deleted} expired resource(s) at ${now.toISOString()}`
          );
        }
      } catch (e) {
        console.warn(
          "Cleanup failed:",
          e instanceof Error ? e.message : String(e)
        );
      }
    };
    // Run once on startup (non-blocking) and then on interval
    runCleanup();
    setInterval(runCleanup, intervalMs);
    console.log(
      `🧹 Scheduled cleanup: every ${minutes} minute(s). Set CLEANUP_INTERVAL_MINUTES=0 to disable.`
    );
  } else {
    console.log("🧹 Scheduled cleanup: disabled (CLEANUP_INTERVAL_MINUTES=0)");
  }
} catch (_) {
  // environment access may not be available; skip scheduling silently
}

import { Hono } from "jsr:@hono/hono";
import { getDb } from "./utils/database.ts";
import { walk } from "jsr:@std/fs";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { toFileUrl } from "jsr:@std/path/to-file-url";

// Parse command-line arguments for port and base URL
const flags = parseArgs(Deno.args, {
  string: ["port", "baseUrl"],
  default: {
    port: "8000",
    baseUrl: "/api",
  },
});

const PORT = parseInt(flags.port, 10);
const BASE_URL = flags.baseUrl;
// The repo's concepts are under src/concepts (server is run from repo root)
const CONCEPTS_DIR = "src/concepts";

/**
 * Main server function to initialize DB, load concepts, and start the server.
 */
async function main() {
  const [db] = await getDb();
  const app = new Hono();

  app.get("/", (c) => c.text("Concept Server is running."));

  // --- Dynamic Concept Loading and Routing ---
  console.log(`Scanning for concepts in ./${CONCEPTS_DIR}...`);

  for await (
    const entry of walk(CONCEPTS_DIR, {
      maxDepth: 1,
      includeDirs: true,
      includeFiles: false,
    })
  ) {
    if (entry.path === CONCEPTS_DIR) continue; // Skip the root directory

    const conceptName = entry.name;
    // Expect a file named <ConceptName>.ts inside the concept folder
    const conceptFilePath = `${entry.path}/${conceptName}.ts`;

    try {
      // ensure file exists before attempting to import
      await Deno.stat(conceptFilePath);
      const modulePath = toFileUrl(Deno.realPathSync(conceptFilePath)).href;
      const module = await import(modulePath);
      // Accept default export or a named export matching the folder name
      type Newable = new (...args: unknown[]) => object;
      let ConceptClass: Newable | null = null;
      if (typeof module.default === "function") {
        ConceptClass = module.default as Newable;
      } else if (typeof module[conceptName] === "function") {
        ConceptClass = module[conceptName] as Newable;
      } else {
        // fallback: pick the first exported function/class
        for (const k of Object.keys(module)) {
          if (typeof module[k] === "function") {
            ConceptClass = module[k] as Newable;
            break;
          }
        }
      }

      if (!ConceptClass) {
        console.warn(
          `! No valid concept class found in ${conceptFilePath}. Skipping.`,
        );
        continue;
      }

      // Instantiate with the DB if the constructor accepts it; otherwise try no-arg.
      let instance: object;
      try {
        instance = new ConceptClass(db as unknown as undefined);
      } catch (_err1) {
        try {
          instance = new ConceptClass();
        } catch (_err2) {
          console.warn(
            `! Could not instantiate concept class from ${conceptFilePath}. Skipping.`,
          );
          continue;
        }
      }
      const conceptApiName = conceptName;
      console.log(
        `- Registering concept: ${conceptName} at ${BASE_URL}/${conceptApiName}`,
      );

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) => {
          if (name === "constructor") return false;
          const val = (instance as Record<string, unknown>)[name];
          return typeof val === "function";
        },
      );

      for (const methodName of methodNames) {
        const actionName = methodName;
        const route = `${BASE_URL}/${conceptApiName}/${actionName}`;

        app.post(route, async (c) => {
          try {
            const body = await c.req.json().catch(() => ({})); // Handle empty body
            const fn = (instance as Record<string, unknown>)[methodName];
            if (typeof fn !== "function") {
              throw new Error("Action not callable");
            }
            // call with instance as this
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res =
              await (fn as (...args: unknown[]) => Promise<unknown> | unknown)
                .call(instance, body as unknown);
            return c.json(res);
          } catch (err) {
            console.error(`Error in ${conceptName}.${methodName}:`, err);
            return c.json({ error: "An internal server error occurred." }, 500);
          }
        });
        console.log(`  - Endpoint: POST ${route}`);
      }
    } catch (e) {
      console.error(
        `! Error loading concept from ${conceptFilePath}:`,
        e,
      );
    }
  }

  console.log(`\nServer listening on http://localhost:${PORT}`);
  Deno.serve({ port: PORT }, app.fetch);
}

// Run the server
main();

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
const CONCEPTS_DIR = "src/concepts";

/**
 * Map a JSON request body into positional arguments for a concept method.
 *
 * Rules:
 * - 0 args: []
 * - Array body: spread as is
 * - Object body:
 *    - If method arity is 1: pass the full object (DTO-style)
 *    - If method arity > 1: pass Object.values(body) in key insertion order
 * - Primitive/other: [body] (unless arity is 0)
 */
function buildArgs(fn: Function, body: unknown): unknown[] {
  const arity = fn.length;

  if (arity === 0) return [];

  if (Array.isArray(body)) {
    return body as unknown[];
  }

  if (body && typeof body === "object") {
    if (arity === 1) {
      // One-arg methods get the DTO object as-is
      return [body];
    }
    // Multi-arg methods: spread values in insertion order
    return Object.values(body as Record<string, unknown>);
  }

  if (body === undefined) {
    return Array.from({ length: arity }).map(() => undefined);
  }

  return [body];
}

async function main() {
  const [db] = await getDb();
  const app = new Hono();

  app.get("/", (c) => c.text("Concept Server is running."));

  console.log(`Scanning for concepts in ./${CONCEPTS_DIR}...`);

  for await (const entry of walk(CONCEPTS_DIR, {
    maxDepth: 1,
    includeDirs: true,
    includeFiles: false,
  })) {
    if (entry.path === CONCEPTS_DIR) continue;

    const conceptName = entry.name;
    const conceptFilePath = `${entry.path}/${conceptName}.ts`;

    try {
      await Deno.stat(conceptFilePath);
      const modulePath = toFileUrl(Deno.realPathSync(conceptFilePath)).href;
      const module = await import(modulePath);

      type Newable = new (...args: unknown[]) => object;
      let ConceptClass: Newable | null = null;
      if (typeof module.default === "function") {
        ConceptClass = module.default as Newable;
      } else if (typeof module[conceptName] === "function") {
        ConceptClass = module[conceptName] as Newable;
      } else {
        for (const k of Object.keys(module)) {
          if (typeof module[k] === "function") {
            ConceptClass = module[k] as Newable;
            break;
          }
        }
      }

      if (!ConceptClass) {
        console.warn(`! No valid concept class found in ${conceptFilePath}. Skipping.`);
        continue;
      }

      let instance: object;
      try {
        instance = new ConceptClass(db as unknown as undefined);
      } catch {
        try {
          instance = new ConceptClass();
        } catch {
          console.warn(`! Could not instantiate concept class from ${conceptFilePath}. Skipping.`);
          continue;
        }
      }

      const conceptApiName = conceptName;
      console.log(`- Registering concept: ${conceptName} at ${BASE_URL}/${conceptApiName}`);

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter((name) => {
        if (name === "constructor") return false;
        const val = (instance as Record<string, unknown>)[name];
        return typeof val === "function";
      });

      for (const methodName of methodNames) {
        const actionName = methodName;
        const route = `${BASE_URL}/${conceptApiName}/${actionName}`;

        app.post(route, async (c) => {
          try {
            const body = await c.req.json().catch(() => ({}));
            const fn = (instance as Record<string, unknown>)[methodName];
            if (typeof fn !== "function") throw new Error("Action not callable");

            const args = buildArgs(fn as Function, body);

            if (Deno.env.get("DEBUG_CONCEPTS") === "1") {
              console.debug(`→ ${conceptName}.${actionName}(${(fn as Function).length})`, {
                body,
                args,
              });
            }

            const res = await (
              fn as (...args: unknown[]) => Promise<unknown> | unknown
            ).call(instance, ...args);

            return c.json(res);
          } catch (err) {
            console.error(`Error in ${conceptName}.${methodName}:`, err);
            const message =
              err instanceof Error ? err.message : "An internal server error occurred.";
            return c.json({ error: message }, 500);
          }
        });

        console.log(`  - Endpoint: POST ${route}`);
      }
    } catch (e) {
      console.error(`! Error loading concept from ${conceptFilePath}:`, e);
    }
  }

  console.log(`\nServer listening on http://localhost:${PORT}`);
  Deno.serve({ port: PORT }, app.fetch);
}

main();

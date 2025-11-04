// src/concepts/Resource/Resource.instrumented.test.ts

// This test exercises the instrumented concept instance (same call-path as the server)
// to ensure DTO-style invocation works end-to-end.

// deno-lint-ignore no-import-prefix
import { assertEquals } from "jsr:@std/assert";
import { Resource } from "@concepts/test_concepts.ts";

// Reuse the branded types from the implementation file for clarity
import type { Owner } from "./Resource.ts";

Deno.test({
  name: "Instrumented Resource.createResource accepts DTO and persists",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const owner = "instrumented-user" as Owner;
    const name = "Instrumented DTO Post";
    const category = "Books";
    const description = "Created via instrumented path test";

    // Create via instrumented concept using a single DTO object
    const resourceID = await Resource.createResource({
      owner,
      name,
      category,
      description,
    });

    // Verify we got an ID back
    assertEquals(typeof resourceID, "string");
    assertEquals(resourceID.length > 0, true);

    // Read back via instrumented concept to verify persistence and field mapping
    const resource = await Resource.getResource({ resourceID });
    assertEquals(resource.id, resourceID);
    assertEquals(resource.owner, owner);
    assertEquals(resource.name, name);
    assertEquals(resource.category, category);
    assertEquals(resource.description, description);
  },
});

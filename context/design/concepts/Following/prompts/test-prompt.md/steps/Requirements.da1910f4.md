---
timestamp: 'Fri Oct 17 2025 22:48:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_224850.9efa0663.md]]'
content_id: da1910f4c85f8ad10acff2934c902f554ce2bd1e098915a44dc451ffc6025c2e
---

# Requirements:

* The test file should be named src/concepts/{ConceptName}.test.ts (for example, src/concepts/Following.test.ts).
* Use the Deno testing framework and import:
  import { assertEquals, assertRejects } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
* Each test should:
  1. Initialize a clean database using: const \[db, client] = await testDb();
  2. Create a new instance of the concept class using that db.
  3. Close the client with await client.close(); at the end of each test.

## Guide for testing concepts:

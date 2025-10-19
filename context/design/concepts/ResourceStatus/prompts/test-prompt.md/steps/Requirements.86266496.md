---
timestamp: 'Sat Oct 18 2025 23:38:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_233857.4930a884.md]]'
content_id: 86266496c9512c1f97d3726c28c05bc0b2352d4bc6a03fad422dc71dca08e9ab
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

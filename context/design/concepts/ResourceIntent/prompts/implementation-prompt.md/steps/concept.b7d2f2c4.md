---
timestamp: 'Tue Oct 21 2025 14:10:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_141030.bf63638a.md]]'
content_id: b7d2f2c4f58ea60359c04d7a42b06067672ec2988e10cd9b3a880e2b37a8c92a
---

# concept: ResourceIntent

**concept**: ResourceIntent \[ResourceID]

* **purpose**: Associate any resource with an intent.
* **principle**:
  * Intent is a simple label applied to a resource.
  * Valid intent labels are defined and managed within this concept.
  * A resource can have at most one intent label associated with it at any given time.
* **state**:
  * a set of `IntentDefinitions` with
    * `intentName` String
  * a set of `IntentEntries` with
    * `resource` ResourceID
    * `intent` String // must reference an existing `IntentDefinition`
* **actions**:
  * `defineIntent(intentName: String): Empty`
    * **requires**:
      * No `IntentDefinition` with `intentName` exists.
    * **effects**:
      * Adds `intentName` to `IntentDefinitions`.
  * `undefineIntent(intentName: String): Empty`
    * **requires**:
      * An `IntentDefinition` for `intentName` exists.
      * No `IntentEntry` uses `intentName`.
    * **effects**:
      * Removes `intentName` from `IntentDefinitions`.
  * `setIntent(resource: ResourceID, intent: String): Empty`
    * **requires**:
      * `intent` must be a defined `IntentDefinition`.
    * **effects**:
      * Creates or updates the `IntentEntry` for `resource` with `intent`.
  * `clearIntent(resource: ResourceID): Empty`
    * **requires**:
      * An `IntentEntry` for `resource` exists.
    * **effects**:
      * Removes the `IntentEntry` for `resource`.
  * `getIntent(resource: ResourceID): { resource: ResourceID, intent: String } | Null`
    * **effects**:
      * Returns the `IntentEntry` for `resource`, or `Null` if none exists.
  * `listIntents(): String[]`
    * **effects**:
      * Returns all defined `intentName`s.
  * `listResourcesByIntent(intent: String): ResourceID[]`
    * **requires**:
      * `intent` must be a defined `IntentDefinition`.
    * **effects**:
      * Returns `ResourceID`s with the given `intent`.

- **invariants**:
  * **uniqueness**: at most one IntentEntry per resource
  * **referential integrity**: every IntentEntry.intent ∈ IntentDefinitions.intentName

## db/connection.ts:

```
// src/db/connection.ts

// deno-lint-ignore no-import-prefix

import { MongoClient } from "npm:mongodb";

// deno-lint-ignore no-import-prefix

import "jsr:@std/dotenv/load";

  

const MONGODB_URL = Deno.env.get("MONGODB_URL");

const DB_NAME = Deno.env.get("DB_NAME");

  

if (!MONGODB_URL || !DB_NAME) {

throw new Error("Missing MONGODB_URL or DB_NAME in environment variables");

}

  

const client = new MongoClient(MONGODB_URL);

  

// Connect once and export the database

await client.connect(); // ✅ Establish connection once

console.log(`✅ Connected to MongoDB database: ${DB_NAME}`);

  

export const db = client.db(DB_NAME);
```

## Guide on how to implement concepts:

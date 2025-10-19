---
timestamp: 'Sat Oct 18 2025 22:58:02 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_225802.f9b2d19d.md]]'
content_id: 646e4402399044fa044aa5af93d104597490e305e79af53b6dde22f818e88c25
---

# concept: Resource

* **concept**: Resource \[ResourceID, Owner]
* **purpose**: Represent any generic entity that can be owned and described by a mandatory name and optional attributes.
* **principle**: An owner can create a resource, which is then uniquely identified and named, and its descriptive attributes can be retrieved or modified.
* **state**:
  * a set of `Resources` with
    * `id` ResourceID
    * `owner` Owner
    * `name` String
    * `category` String?
    * `description` String?
* **actions**:
  * `createResource (owner: Owner, name: String, category: String?, description: String?): (resourceID: ResourceID)`
    * **requires**: `name is not an empty string`.
    * **effects**: Creates a new `Resource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`. Returns the `id` of the newly created resource.
  * `updateResource (resourceID: ResourceID, name: String?, category: String?, description: String?): Empty`
    * **requires**:
      * A `Resource` entry with `id = resourceID` exists.
      * If `name` is provided (i.e., not `null`), `name is not an empty string`.
    * **effects**:
      * If `name` is provided and is not an empty string, updates the `name` for the given `resourceID`.
      * If `category` is provided, updates the `category` for the given `resourceID`. If `null` is provided, it clears the existing `category`.
      * If `description` is provided, updates the `description` for the given `resourceID`. If `null` is provided, it clears the existing `description`.
  * `deleteResource (resourceID: ResourceID): Empty`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Deletes the `Resource` entry corresponding to `resourceID`.
  * `getResource (resourceID: ResourceID): (resource: Resource)`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Returns the complete `Resource` object associated with this `resourceID`.

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

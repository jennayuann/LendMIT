---
timestamp: 'Tue Oct 21 2025 14:15:23 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_141523.949f0613.md]]'
content_id: 092dedf62854771845322c647011fa596872d1247b69466fa992313c0a0315b1
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

## Implementation of concept to write tests for:

```
// src/concepts/ResourceIntent.ts

  

import { Collection, Db, MongoError } from "mongodb";

import { ID, Empty } from "@utils/types.ts";

  

// ResourceID is a generic ID type as per the concept specification.

type ResourceID = ID;

  

/**

* Interface for IntentDefinition documents stored in MongoDB.

* The `_id` field directly represents the `intentName`, ensuring its uniqueness

* and simplifying lookup operations.

*/

interface MongoIntentDefinition {

_id: string; // Corresponds to intentName

}

  

/**

* Interface for IntentEntry documents stored in MongoDB.

* Each entry associates a resource with a defined intent.

* The `_id` field is the `resource` ID itself, which enforces the invariant

* that a resource can have at most one intent entry.

*/

interface MongoIntentEntry {

_id: ResourceID; // The resource ID serves as the primary key for the intent entry.

intent: string; // The intentName, referencing an existing MongoIntentDefinition._id.

}

  

/**

* Concept: ResourceIntent

* Purpose: Associate any resource with an intent.

* Principle:

* - Intent is a simple label applied to a resource.

* - Valid intent labels are defined and managed within this concept.

* - A resource can have at most one intent label associated with it at any given time.

* State:

* - A set of `IntentDefinitions` (stored in the `ResourceIntent.intentDefinitions` collection).

* - A set of `IntentEntries` (stored in the `ResourceIntent.intentEntries` collection).

*/

export default class ResourceIntent {

private readonly intentDefinitions: Collection<MongoIntentDefinition>;

private readonly intentEntries: Collection<MongoIntentEntry>;

  

constructor(private readonly db: Db) {

// Collection names are prefixed with the concept name to ensure logical grouping

// and prevent naming collisions with other concepts' state components.

this.intentDefinitions = this.db.collection("ResourceIntent.intentDefinitions");

this.intentEntries = this.db.collection("ResourceIntent.intentEntries");

}

  

/**

* defineIntent(intentName: String): Empty

*

* **requires**:

* - No `IntentDefinition` with `intentName` exists.

* **effects**:

* - Adds `intentName` to `IntentDefinitions`.

*/

async defineIntent({ intentName }: { intentName: string }): Promise<Empty> {

// Enforce "requires" condition: No IntentDefinition with `intentName` exists.

const existing = await this.intentDefinitions.findOne({ _id: intentName });

if (existing) {

throw new Error(`ResourceIntent: defineIntent failed. Intent definition '${intentName}' already exists.`);

}

  

// Perform "effects": Adds `intentName` to `IntentDefinitions`.

try {

await this.intentDefinitions.insertOne({ _id: intentName });

} catch (e) {

// Catch potential duplicate key errors in case of a race condition

if (e instanceof MongoError && e.code === 11000) {

throw new Error(`ResourceIntent: defineIntent failed due to a concurrent definition of '${intentName}'.`);

}

throw e; // Re-throw other unexpected errors

}

return {};

}

  

/**

* undefineIntent(intentName: String): Empty

*

* **requires**:

* - An `IntentDefinition` for `intentName` exists.

* - No `IntentEntry` uses `intentName`.

* **effects**:

* - Removes `intentName` from `IntentDefinitions`.

*/

async undefineIntent({ intentName }: { intentName: string }): Promise<Empty> {

// Enforce "requires" condition 1: An IntentDefinition for `intentName` exists.

const existingDefinition = await this.intentDefinitions.findOne({ _id: intentName });

if (!existingDefinition) {

throw new Error(`ResourceIntent: undefineIntent failed. Intent definition '${intentName}' does not exist.`);

}

  

// Enforce "requires" condition 2: No `IntentEntry` uses `intentName`.

const usedByEntries = await this.intentEntries.findOne({ intent: intentName });

if (usedByEntries) {

throw new Error(`ResourceIntent: undefineIntent failed. Intent definition '${intentName}' is currently in use by resource '${usedByEntries._id}' and cannot be undefined.`);

}

  

// Perform "effects": Removes `intentName` from `IntentDefinitions`.

const result = await this.intentDefinitions.deleteOne({ _id: intentName });

if (result.deletedCount === 0) {

// This should ideally not happen if the `findOne` check above passed.

throw new Error(`ResourceIntent: undefineIntent failed unexpectedly to delete '${intentName}'.`);

}

return {};

}

  

/**

* setIntent(resource: ResourceID, intent: String): Empty

*

* **requires**:

* - `intent` must be a defined `IntentDefinition`.

* **effects**:

* - Creates or updates the `IntentEntry` for `resource` with `intent`.

*/

async setIntent({ resource, intent }: { resource: ResourceID; intent: string }): Promise<Empty> {

// Enforce "requires" condition: `intent` must be a defined `IntentDefinition`.

const existingDefinition = await this.intentDefinitions.findOne({ _id: intent });

if (!existingDefinition) {

throw new Error(`ResourceIntent: setIntent failed. Intent definition '${intent}' is not defined.`);

}

  

// Perform "effects": Creates or updates the `IntentEntry` for `resource` with `intent`.

// By using `resource` as the `_id` for `MongoIntentEntry` documents and `upsert: true`,

// we automatically satisfy the invariant "at most one IntentEntry per resource".

await this.intentEntries.updateOne(

{ _id: resource }, // Query by the resource ID (which is the _id of the entry)

{ $set: { intent: intent } }, // Set or update the intent

{ upsert: true } // Create the document if it doesn't exist

);

return {};

}

  

/**

* clearIntent(resource: ResourceID): Empty

*

* **requires**:

* - An `IntentEntry` for `resource` exists.

* **effects**:

* - Removes the `IntentEntry` for `resource`.

*/

async clearIntent({ resource }: { resource: ResourceID }): Promise<Empty> {

// Enforce "requires" condition: An `IntentEntry` for `resource` exists.

const existingEntry = await this.intentEntries.findOne({ _id: resource });

if (!existingEntry) {

throw new Error(`ResourceIntent: clearIntent failed. No intent entry found for resource '${resource}'.`);

}

  

// Perform "effects": Removes the `IntentEntry` for `resource`.

const result = await this.intentEntries.deleteOne({ _id: resource });

if (result.deletedCount === 0) {

// This case should ideally not be reached if `findOne` above succeeded.

throw new Error(`ResourceIntent: clearIntent failed unexpectedly to delete intent for resource '${resource}'.`);

}

return {};

}

  

/**

* getIntent(resource: ResourceID): { resource: ResourceID, intent: String } | Null

*

* **effects**:

* - Returns the `IntentEntry` for `resource`, or `Null` if none exists.

*/

async getIntent({ resource }: { resource: ResourceID }): Promise<{ resource: ResourceID; intent: string } | null> {

// Perform "effects": Returns the `IntentEntry` for `resource`, or `Null` if none exists.

const entry = await this.intentEntries.findOne({ _id: resource });

  

if (!entry) {

return null;

}

  

// Return value exactly as specified: { resource: ResourceID, intent: String }

return {

resource: entry._id, // `_id` of the entry is the `ResourceID` itself

intent: entry.intent,

};

}

  

/**

* listIntents(): String[]

*

* **effects**:

* - Returns all defined `intentName`s.

*/

async listIntents(): Promise<string[]> {

// Perform "effects": Returns all defined `intentName`s.

// Project only the `_id` field, which contains the `intentName`.

const definitions = await this.intentDefinitions.find({}).project<{ _id: string }>({ _id: 1 }).toArray();

return definitions.map((def) => def._id);

}

  

/**

* listResourcesByIntent(intent: String): ResourceID[]

*

* **requires**:

* - `intent` must be a defined `IntentDefinition`.

* **effects**:

* - Returns `ResourceID`s with the given `intent`.

*/

async listResourcesByIntent({ intent }: { intent: string }): Promise<ResourceID[]> {

// Enforce "requires" condition: `intent` must be a defined `IntentDefinition`.

const existingDefinition = await this.intentDefinitions.findOne({ _id: intent });

if (!existingDefinition) {

throw new Error(`ResourceIntent: listResourcesByIntent failed. Intent definition '${intent}' is not defined.`);

}

  

// Perform "effects": Returns `ResourceID`s with the given `intent`.

// Project only the `_id` field, which contains the `ResourceID`.

const entries = await this.intentEntries.find({ intent: intent }).project<{ _id: ResourceID }>({ _id: 1 }).toArray();

return entries.map((entry) => entry._id);

}

}

  

// Import the shared MongoDB connection and export an instantiated class for use throughout the application.

import { db } from "@/db/connection.ts";

export const resourceIntent = new ResourceIntent(db);
```

## utils/types.ts:

```
declare const Brand: unique symbol;

  

/**

* Generic ID: effectively a string,

* but uses type branding.

*/

export type ID = string & { [Brand]: true };

  

/**

* Empty record type: enforces no entries.

*/

export type Empty = Record<PropertyKey, never>;
```

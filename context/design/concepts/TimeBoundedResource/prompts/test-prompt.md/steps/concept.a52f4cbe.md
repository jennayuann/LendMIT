---
timestamp: 'Sun Oct 19 2025 00:18:03 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_001803.b3178e5c.md]]'
content_id: a52f4cbe76f56647dd02fdac01a9fa683916e26095cf4015716aeb5147645dc1
---

# concept: TimeBoundedResource

* **concept**: TimeBoundedResource \[ResourceID]
* **purpose**: Manage time-based availability and expiration windows for any generic resource.
* **principle**: This concept defines and tracks availability windows for resources with optional start and end times, corresponding to starting now and available indefinitely respectively. It can report a resource's current window and signals when a resource's availability has ended.
* **state**:
  * a set of `TimeWindow` entries, each consisting of:
    * `resource`: ResourceID
    * `availableFrom`: DateTime? (null implies available starting now)
    * `availableUntil`: DateTime? (null implies indefinitely available into the future)
* **actions**:
  * `defineTimeWindow (resource: ResourceID, availableFrom: DateTime?, availableUntil: DateTime?): Empty`
    * **requires**:
      * If both `availableFrom` and `availableUntil` are provided (non-null), then `availableFrom` must be strictly earlier than `availableUntil`.
    * **effects**: Creates a new `TimeWindow` entry for the given `resource` or updates an existing one with the specified availability bounds. If `availableFrom` is not provided, then it's available starting now. If `availableUntil` is not provided, then it's available indefinitely.
  * `getTimeWindow (resource: ResourceID): TimeWindow?`
    * **effects**: Returns the `TimeWindow` entry for the specified `resource`, containing its `resource` ID, `availableFrom`, and `availableUntil` times. Returns `null` if no time window is defined for the resource.
  * `expireResource (resource: ResourceID): Empty`
    * **requires**:
      * A `TimeWindow` entry exists for `resource`.
      * The `availableUntil` for that `resource` is defined (non-null).
      * The `currentTime` (the moment this action is triggered) is greater than or equal to the `availableUntil` value for the `resource`.
    * **effects**: This action serves as an event notification. It explicitly changes no state within this concept. Its occurrence signals to other concepts (via synchronization) that the resource's time-bound availability (as defined by its `availableUntil` property) has ended.

## Implementation of concept to write tests for:

```
// src/concepts/TimeBoundedResource.ts

  

import { Collection, Db } from "mongodb";

import { db } from "@/db/connection.ts";

import { ID, Empty } from "@utils/types.ts";

  

// MongoDB collection name for this concept

const COLLECTION_NAME = "timeBoundedResources";

  

// Type alias for ResourceID, based on the generic ID type

type ResourceID = ID;

  

/**

* @concept TimeBoundedResource

* @purpose Manage time-based availability and expiration windows for any generic resource.

* @principle This concept defines and tracks availability windows for resources with

* optional start and end times, corresponding to starting now and available

* indefinitely respectively. It can report a resource's current window and

* signals when a resource's availability has ended.

*

* @state

* A set of `TimeWindow` entries, each consisting of:

* `resource`: ResourceID

* `availableFrom`: DateTime? (null implies available starting now)

* `availableUntil`: DateTime? (null implies indefinitely available into the future)

*/

interface TimeWindow {

_id: ResourceID; // The resource ID serves as the primary key for the time window document

resource: ResourceID; // Explicitly store resource ID as per state description

availableFrom: Date | null;

availableUntil: Date | null;

}

  

export class TimeBoundedResource {

private collection: Collection<TimeWindow>;

  

constructor(private readonly db: Db) {

this.collection = this.db.collection<TimeWindow>(COLLECTION_NAME);

}

  

/**

* Defines or updates a time window for a given resource.

*

* @action defineTimeWindow

* @param {object} params - The parameters for defining the time window.

* @param {ResourceID} params.resource - The ID of the resource.

* @param {Date | null} params.availableFrom - The start date/time for availability.

* If null, the resource is available starting now.

* @param {Date | null} params.availableUntil - The end date/time for availability.

* If null, the resource is available indefinitely.

* @returns {Promise<Empty>} An empty object indicating success.

*

* @requires If both `availableFrom` and `availableUntil` are provided (non-null),

* then `availableFrom` must be strictly earlier than `availableUntil`.

*

* @effects Creates a new `TimeWindow` entry for the given `resource` or updates an existing one

* with the specified availability bounds. If `availableFrom` is not provided (null),

* then it's set to the current time. If `availableUntil` is not provided (null),

* then it's stored as null to indicate indefinite availability.

*/

async defineTimeWindow(

{ resource, availableFrom, availableUntil }: {

resource: ResourceID;

availableFrom: Date | null;

availableUntil: Date | null;

},

): Promise<Empty> {

// Requires: If both availableFrom and availableUntil are provided (non-null),

// then availableFrom must be strictly earlier than availableUntil.

if (availableFrom instanceof Date && availableUntil instanceof Date) {

if (availableFrom.getTime() >= availableUntil.getTime()) {

throw new Error(

"Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",

);

}

}

  

const now = new Date();

// If availableFrom is null in the input, it means "starting now". Store the actual current time.

const finalAvailableFrom = availableFrom === null ? now : availableFrom;

// If availableUntil is null in the input, it means "indefinitely". Store null.

const finalAvailableUntil = availableUntil;

  

const filter = { _id: resource };

const update = {

$set: {

resource: resource,

availableFrom: finalAvailableFrom,

availableUntil: finalAvailableUntil,

},

};

const options = { upsert: true }; // Create a new document if one does not exist

  

await this.collection.updateOne(filter, update, options);

  

return {};

}

  

/**

* Retrieves the time window for a specified resource.

*

* @action getTimeWindow

* @param {object} params - The parameters for getting the time window.

* @param {ResourceID} params.resource - The ID of the resource.

* @returns {Promise<TimeWindow | null>} The `TimeWindow` entry for the resource,

* or `null` if no time window is defined for it.

*

* @effects Returns the `TimeWindow` entry for the specified `resource`, containing its

* `resource` ID, `availableFrom`, and `availableUntil` times.

* Returns `null` if no time window is defined for the resource.

*/

async getTimeWindow(

{ resource }: { resource: ResourceID },

): Promise<TimeWindow | null> {

// MongoDB returns Date objects directly from the BSON Date type, which fits the `Date | null` interface.

// The `_id` will also be present in the returned document, conforming to the `TimeWindow` interface.

const timeWindow = await this.collection.findOne({ _id: resource });

return timeWindow;

}

  

/**

* Signals that a resource's time-bound availability has ended. This action serves

* as an event notification and does not alter the state within this concept.

*

* @action expireResource

* @param {object} params - The parameters for expiring the resource.

* @param {ResourceID} params.resource - The ID of the resource.

* @returns {Promise<Empty>} An empty object indicating the successful signaling of expiration.

*

* @requires A `TimeWindow` entry must exist for the specified `resource`.

* @requires The `availableUntil` for that `resource` must be defined (non-null).

* @requires The `currentTime` (the moment this action is triggered) must be greater than

* or equal to the `availableUntil` value for the `resource`.

*

* @effects This action explicitly changes no state within this concept. Its occurrence

* signals to other concepts (via synchronization) that the resource's time-bound

* availability (as defined by its `availableUntil` property) has ended.

*/

async expireResource({ resource }: { resource: ResourceID }): Promise<Empty> {

const timeWindow = await this.collection.findOne({ _id: resource });

const currentTime = new Date();

  

// Requires: A TimeWindow entry exists for resource.

if (!timeWindow) {

throw new Error(

`Validation Error: No TimeWindow entry found for resource '${resource}'.`,

);

}

  

// Requires: The availableUntil for that resource is defined (non-null).

if (timeWindow.availableUntil === null) {

throw new Error(

`Validation Error: 'availableUntil' is not defined (null) for resource '${resource}'. ` +

"Cannot expire an indefinitely available resource through this action.",

);

}

  

// Requires: The currentTime is greater than or equal to the availableUntil value.

if (currentTime.getTime() < timeWindow.availableUntil.getTime()) {

throw new Error(

`Validation Error: Current time (${currentTime.toISOString()}) is earlier than ` +

`'availableUntil' (${timeWindow.availableUntil.toISOString()}) for resource '${resource}'. ` +

"Resource is not yet expired.",

);

}

  

// Effects: This action explicitly changes no state within this concept.

// Its sole purpose is to serve as an event notification.

  

return {};

}

}

  

// Export an instantiated class

export const timeBoundedResource = new TimeBoundedResource(db);
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

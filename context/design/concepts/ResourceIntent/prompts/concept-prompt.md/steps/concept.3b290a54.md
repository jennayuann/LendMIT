---
timestamp: 'Tue Oct 21 2025 13:42:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_134228.0596706d.md]]'
content_id: 3b290a54254b3c7f8351c07dc78d292f78dfb25de5d51e83db8e959ba96428be
---

# concept: ResourceIntent

* **concept**: ResourceIntent \[ResourceID, UserID]
* **purpose**: Capture and manage a user’s declared intent to either borrow or lend a specific resource, enabling matching, filtering, and downstream workflows without overloading the resource itself.
* **principle**:
  * A user can declare at most one active intent per resource at a time.
  * Resource owners can declare LEND intents for their resources; non-owners can declare BORROW intents.
  * Intents follow a simple lifecycle and can include optional metadata (quantity, timeframe, notes) to aid matching and enforcement.

**state**:

* a set of `IntentEntries` with
  * `resource` ResourceID
  * `user` UserID
  * `type` String in {"BORROW", "LEND"}
  * `status` String in {"ACTIVE", "CANCELLED", "FULFILLED", "EXPIRED"}
  * `quantity` Number? (optional, > 0)
  * `timeWindow` { `start`: Timestamp, `end`: Timestamp }? (optional)
  * `notes` String? (optional)
  * `createdAt` Timestamp
  * `updatedAt` Timestamp
* a set of `Constraints` (implicit invariants)
  * Uniqueness: at most one `IntentEntry` with `status = ACTIVE` per (`resource`, `user`).
  * Validity rule: if `timeWindow` is present, `timeWindow.start <= timeWindow.end`.

**actions**:

* `declareIntent(resourceID: ResourceID, userID: UserID, type: "BORROW" | "LEND", quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String): Empty`
  * **requires**:
    * `resourceID` exists.
    * `userID` exists.
    * If `type = "LEND"`, `userID` is the owner of `resourceID`.
    * If `type = "BORROW"`, `userID` is not the owner of `resourceID`.
    * No existing `IntentEntry` with `status = ACTIVE` for (`resourceID`, `userID`).
    * If `quantity` provided, it’s > 0.
    * If `timeWindow` provided, `timeWindow.start <= timeWindow.end`.
  * **effects**:
    * Creates an `IntentEntry` with `status = ACTIVE` and provided fields; sets `createdAt`, `updatedAt`.
* `updateIntent(resourceID: ResourceID, userID: UserID, patch: { quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String }): Empty`
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resourceID`, `userID`).
    * If updating `quantity`, it’s > 0.
    * If updating `timeWindow`, `timeWindow.start <= timeWindow.end`.
  * **effects**:
    * Updates the specified fields on the active `IntentEntry`; sets `updatedAt`.
* `cancelIntent(resourceID: ResourceID, userID: UserID): Empty`
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resourceID`, `userID`).
  * **effects**:
    * Sets the intent’s `status = CANCELLED`; updates `updatedAt`.
* `fulfillIntent(resourceID: ResourceID, userID: UserID): Empty`
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resourceID`, `userID`).
    * Any external preconditions for fulfillment (e.g., a successful match or transaction) hold.
  * **effects**:
    * Sets the intent’s `status = FULFILLED`; updates `updatedAt`.
* `expireIntent(resourceID: ResourceID, userID: UserID, asOf: Timestamp): Empty`
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resourceID`, `userID`).
    * The intent has a `timeWindow` and `timeWindow.end < asOf`.
  * **effects**:
    * Sets the intent’s `status = EXPIRED`; updates `updatedAt`.
* `switchIntentType(resourceID: ResourceID, userID: UserID, newType: "BORROW" | "LEND"): Empty`
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resourceID`, `userID`).
    * If `newType = "LEND"`, `userID` is the owner of `resourceID`.
    * If `newType = "BORROW"`, `userID` is not the owner of `resourceID`.
  * **effects**:
    * Updates the intent’s `type` to `newType`; updates `updatedAt`.
* `getIntent(resourceID: ResourceID, userID: UserID): IntentEntry | Null`
  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns the most recent `IntentEntry` for (`resourceID`, `userID`), if any.
* `listResourceIntents(resourceID: ResourceID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`
  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns all intents for `resourceID`, optionally filtered by `status` and/or `type`.
* `listUserIntents(userID: UserID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`
  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns all intents declared by `userID`, optionally filtered by `status` and/or `type`.
* `clearExpiredIntents(asOf: Timestamp): Empty`
  * **requires**:
    * None.
  * **effects**:
    * For every ACTIVE intent with `timeWindow.end < asOf`, sets `status = EXPIRED`; updates `updatedAt`.

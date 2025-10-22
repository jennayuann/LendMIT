---
timestamp: 'Tue Oct 21 2025 13:39:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_133947.6a21ce91.md]]'
content_id: b6937140453da6ef5614ee9f4d6af98c32bd59ec9f7271c9036828a5de0ee966
---

# concept: ResourceIntent

**concept**: ResourceIntent \[ResourceID, UserID]

* **purpose**: Capture and manage a user’s declared intent to either borrow or lend a specific resource, enabling matching, filtering, and downstream workflows without overloading the resource itself.
* **principle**:
  * A user can declare at most one active intent per resource at a time.
  * Resource owners can declare LEND intents for their resources; non-owners can declare BORROW intents.
  * Intents follow a simple lifecycle and can include optional metadata (quantity, timeframe, notes) to aid matching and enforcement.

**state**:

* a set of `IntentEntries` with
  * `resource` ResourceID
  * `user` UserID
  * `type` String in {"BORROW", "LEND"}
  * `status` String in {"ACTIVE", "CANCELLED", "FULFILLED", "EXPIRED"}
  * `quantity` Number (optional, > 0)
  * `timeWindow` { `start`: Timestamp, `end`: Timestamp } (optional; if present, `start` <= `end`)
  * `notes` String (optional, reasonable length)
  * `createdAt` Timestamp
  * `updatedAt` Timestamp
* a set of `Constraints` (implicit invariants)
  * Uniqueness: at most one `IntentEntry` with `status = ACTIVE` per (`resource`, `user`)
  * Ownership rule: only the resource owner may create a `LEND` intent for that resource
  * Self-intent rule: a resource owner may not create a `BORROW` intent on their own resource
  * Validity rule: if `timeWindow` is present, it must be valid; expired windows imply `EXPIRED`

**actions**:

* `declareIntent(resource: ResourceID, user: UserID, type: "BORROW" | "LEND", quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String): Empty`

  * **requires**:
    * `resource` exists.
    * `user` exists.
    * If `type = "LEND"`, `user` is the owner of `resource`.
    * If `type = "BORROW"`, `user` is not the owner of `resource`.
    * No existing `IntentEntry` with `status = ACTIVE` for (`resource`, `user`).
    * If `quantity` provided, it’s > 0.
    * If `timeWindow` provided, `start` <= `end`.
  * **effects**:
    * Creates an `IntentEntry` with `status = ACTIVE` and provided fields; sets `createdAt`, `updatedAt`.
* `updateIntent(resource: ResourceID, user: UserID, patch: { quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String }): Empty`

  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    * If updating `quantity`, it’s > 0.
    * If updating `timeWindow`, `start` <= `end`.
  * **effects**:
    * Updates the specified fields on the active `IntentEntry`; sets `updatedAt`.
* `cancelIntent(resource: ResourceID, user: UserID): Empty`

  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
  * **effects**:
    * Sets the intent’s `status = CANCELLED`; updates `updatedAt`.
* `fulfillIntent(resource: ResourceID, user: UserID): Empty`

  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    * Any external preconditions for fulfillment (e.g., a successful match or transaction) hold.
  * **effects**:
    * Sets the intent’s `status = FULFILLED`; updates `updatedAt`.
* `expireIntent(resource: ResourceID, user: UserID, asOf: Timestamp): Empty`

  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    * The intent has a `timeWindow` and `timeWindow.end` < `asOf`.
  * **effects**:
    * Sets the intent’s `status = EXPIRED`; updates `updatedAt`.
* `switchIntentType(resource: ResourceID, user: UserID, newType: "BORROW" | "LEND"): Empty`

  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    * Switching respects ownership rules (owner only → "LEND"; non-owner only → "BORROW").
  * **effects**:
    * Updates the intent’s `type` to `newType`; updates `updatedAt`.
    * (Optional policy) Clears or preserves `quantity/timeWindow/notes` according to application rules.
* `getIntent(resource: ResourceID, user: UserID): IntentEntry | Null`

  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns the most recent `IntentEntry` for (`resource`, `user`), if any.
* `listResourceIntents(resource: ResourceID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`

  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns all intents for `resource`, optionally filtered by `status` and/or `type`.
* `listUserIntents(user: UserID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`

  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns all intents declared by `user`, optionally filtered by `status` and/or `type`.
* `clearExpiredIntents(asOf: Timestamp): Empty`

  * **requires**:
    * None.
  * **effects**:
    * For every ACTIVE intent with `timeWindow.end < asOf`, sets `status = EXPIRED`; updates `updatedAt`.

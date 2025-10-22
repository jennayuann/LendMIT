---
timestamp: 'Tue Oct 21 2025 13:46:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_134635.93e03ad2.md]]'
content_id: 74ecdf23586d31e6005bf2aecefb05bccb3f6f84c63c46179bd4ef94150e822d
---

# Revised Concept: ResourceIntent

**concept**: ResourceIntent \[ResourceID, UserID]

* **purpose**: To capture and manage a user’s declared intent to either borrow or lend a specific resource. It provides a modular mechanism for storing these intents, enabling subsequent matching, filtering, and downstream workflows without burdening the `Resource` concept with intent-specific logic.
* **principle**:
  * A user can declare at most one active intent per resource at a time.
  * The concept manages the lifecycle of these intents.
  * Intents can include optional metadata (quantity, timeframe, notes) to aid matching and enforcement.
  * **Crucially, `ResourceIntent` is agnostic to the *authorization* of an intent declaration; it simply records the intent. Authorization based on external factors (e.g., resource ownership) is handled by composition (syncs).**

**state**:

* a set of `IntentEntries` with
  * `resource` ResourceID
  * `user` UserID
  * `type` String in {"BORROW", "LEND"}
  * `status` String in {"ACTIVE", "CANCELLED", "FULFILLED", "EXPIRED"}
  * `quantity` Number (optional, > 0)
  * `timeWindow` { `start`: Timestamp, `end`: Timestamp } (optional; if present, `start` <= `end`)
  * `notes` String (optional, reasonable length)
  * `createdAt` Timestamp
  * `updatedAt` Timestamp
* a set of `Constraints` (implicit invariants)
  * Uniqueness: At most one `IntentEntry` with `status = ACTIVE` per (`resource`, `user`).
  * Validity rule: If `timeWindow` is present, `timeWindow.start` <= `timeWindow.end`.

**actions**:

* `declareIntent(resource: ResourceID, user: UserID, type: "BORROW" | "LEND", quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String): Empty`

  * **purpose**: Creates a new active intent for a given resource and user.
  * **requires**:
    * `resource` exists (as an opaque identifier).
    * `user` exists (as an opaque identifier).
    * No existing `IntentEntry` with `status = ACTIVE` for (`resource`, `user`).
    * If `quantity` provided, it’s > 0.
    * If `timeWindow` provided, `start` <= `end`.
  * **effects**:
    * Creates an `IntentEntry` with `status = ACTIVE` and provided fields; sets `createdAt`, `updatedAt`.
* `updateIntent(resource: ResourceID, user: UserID, patch: { quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String }): Empty`

  * **purpose**: Modifies the details of an existing active intent.
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    * If updating `quantity`, it’s > 0.
    * If updating `timeWindow`, `start` <= `end`.
  * **effects**:
    * Updates the specified fields on the active `IntentEntry`; sets `updatedAt`.
* `cancelIntent(resource: ResourceID, user: UserID): Empty`

  * **purpose**: Marks an active intent as cancelled by the user or an external process.
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
  * **effects**:
    * Sets the intent’s `status = CANCELLED`; updates `updatedAt`.
* `fulfillIntent(resource: ResourceID, user: UserID): Empty`

  * **purpose**: Marks an active intent as successfully fulfilled, typically after a matching transaction.
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
  * **effects**:
    * Sets the intent’s `status = FULFILLED`; updates `updatedAt`.
* `expireIntent(resource: ResourceID, user: UserID, asOf: Timestamp): Empty`

  * **purpose**: Explicitly marks an intent as expired if its time window has passed.
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    * The intent has a `timeWindow` and `timeWindow.end` < `asOf`.
  * **effects**:
    * Sets the intent’s `status = EXPIRED`; updates `updatedAt`.
* `switchIntentType(resource: ResourceID, user: UserID, newType: "BORROW" | "LEND"): Empty`

  * **purpose**: Changes the type of an existing active intent (e.g., from BORROW to LEND).
  * **requires**:
    * An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
  * **effects**:
    * Updates the intent’s `type` to `newType`; updates `updatedAt`.
    * (Optional policy for implementing application) Clears or preserves `quantity/timeWindow/notes` according to application rules.
* `getIntent(resource: ResourceID, user: UserID): IntentEntry | Null`

  * **purpose**: Retrieves the most recent intent for a specific resource and user.
  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns the most recent `IntentEntry` for (`resource`, `user`), if any.
* `listResourceIntents(resource: ResourceID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`

  * **purpose**: Lists intents associated with a particular resource.
  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns all intents for `resource`, optionally filtered by `status` and/or `type`.
* `listUserIntents(user: UserID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`

  * **purpose**: Lists all intents declared by a specific user.
  * **requires**:
    * None (read-only).
  * **effects**:
    * Returns all intents declared by `user`, optionally filtered by `status` and/or `type`.
* `clearExpiredIntents(asOf: Timestamp): Empty`

  * **purpose**: A batch action to mark all time-window-expired active intents as expired.
  * **requires**:
    * None.
  * **effects**:
    * For every ACTIVE intent with `timeWindow.end < asOf`, sets `status = EXPIRED`; updates `updatedAt`.

***

### Rationale for Changes:

1. **Removed Ownership Rules from `state.Constraints`**:
   * The original concept included "Ownership rule: only the resource owner may create a LEND intent for that resource" and "Self-intent rule: a resource owner may not create a BORROW intent on their own resource" as `Constraints`.
   * **Why removed**: These rules depend on knowing the `owner` property of a `Resource`, which is information held by the `Resource` concept. Including this within `ResourceIntent` directly violates the principle of "Concept Independence" and "Separation of Concerns" because `ResourceIntent` would need to "know" about `Resource`'s internal state.
   * **How it's handled**: These are *authorization* rules that should be enforced externally via `syncs` (as illustrated in the thought process). The `ResourceIntent` concept itself is only concerned with managing the *existence* and *lifecycle* of an intent, regardless of *who* declared it or *if* they were authorized to do so according to external business rules.

2. **Removed Ownership Rules from `declareIntent` and `switchIntentType` `requires`**:
   * Similar to the state constraints, the action `requires` clauses that checked for `user` being the `owner` of `resource` were removed.
   * **Why removed**: For the same reasons as above. The `ResourceIntent` concept provides the primitive actions. The decision to *allow* a `declareIntent` or `switchIntentType` action to proceed, based on ownership, is an application-level concern that orchestrates `ResourceIntent` and `Resource` via `syncs`.

3. **Clarified Purpose and Principle**:
   * The `principle` now explicitly states: "**Crucially, `ResourceIntent` is agnostic to the *authorization* of an intent declaration; it simply records the intent. Authorization based on external factors (e.g., resource ownership) is handled by composition (syncs).**" This makes the independence explicit.

By making these changes, `ResourceIntent` becomes:

* **More Modular and Independent**: It stands alone, focusing purely on the mechanics of creating, updating, and managing a user's intent. It doesn't query or directly reference the state of other concepts.
* **More Generic**: It doesn't hardcode assumptions about resource ownership, making it applicable to scenarios where resources might not have a single owner, or where ownership rules are different.
* **More Aligned with Concept Design Principles**: The "who can do what" (authorization) is separated from the "what is the base functionality" (intent management), allowing for flexible composition via syncs.

### Example Syncs for Authorization (using the `Resource` concept):

To illustrate how the removed ownership rules would be enforced, here are examples of syncs that would call `ResourceIntent.declareIntent`:

```
// Sync to allow a user to declare a LEND intent if they own the resource
sync AuthorizeLendIntent
when
    Request.DeclareLendIntent (resource: r, user: u, quantity: q?, timeWindow: tw?, notes: n?) // A user requests to declare a LEND intent
where
    in Resource: owner of r is u // AND the requesting user 'u' is the owner of 'r'
    in ResourceIntent: NOT EXISTS (active IntentEntry for (r, u)) // AND no active intent already exists for this resource-user pair
then
    ResourceIntent.declareIntent (resource: r, user: u, type: "LEND", quantity: q, timeWindow: tw, notes: n)

// Sync to allow a user to declare a BORROW intent if they DO NOT own the resource
sync AuthorizeBorrowIntent
when
    Request.DeclareBorrowIntent (resource: r, user: u, quantity: q?, timeWindow: tw?, notes: n?) // A user requests to declare a BORROW intent
where
    in Resource: NOT (owner of r is u) // AND the requesting user 'u' is NOT the owner of 'r'
    in ResourceIntent: NOT EXISTS (active IntentEntry for (r, u)) // AND no active intent already exists for this resource-user pair
then
    ResourceIntent.declareIntent (resource: r, user: u, type: "BORROW", quantity: q, timeWindow: tw, notes: n)

// Similar syncs would be needed for `switchIntentType` if ownership rules apply to switching.
```

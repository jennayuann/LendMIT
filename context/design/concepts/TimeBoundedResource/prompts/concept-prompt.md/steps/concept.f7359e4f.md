---
timestamp: 'Thu Oct 16 2025 20:03:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_200353.cbd14f74.md]]'
content_id: f7359e4f13e5a60273be3c80e1ac99cefca0963eb8d0c077f3ad2efd1ce45a76
---

# concept: TimeBoundedResource

* **concept**: TimeBoundedResource \[ResourceID]
* **purpose**: Manage time-based availability and expiration windows for any generic resource.
* **principle**: This concept defines and tracks availability windows (specified by optional start and end times) for resources. It can report a resource's current window and signals when a resource's availability has ended according to its defined `availableUntil` bound.
* **state**:
  * a set of `TimeWindow` entries, each consisting of:
    * `resource`: ResourceID
    * `availableFrom`: DateTime? (null implies indefinitely available from the past/start)
    * `availableUntil`: DateTime? (null implies indefinitely available into the future)
* **actions**:
  * `defineTimeWindow (resource: ResourceID, availableFrom: DateTime?, availableUntil: DateTime?): Empty`
    * **requires**:
      * At least one of `availableFrom` or `availableUntil` must be provided (non-null).
      * If `availableFrom` is provided (non-null), it must be `currentTime` or in the future.
      * If `availableUntil` is provided (non-null), it must be `currentTime` or in the future.
      * If both `availableFrom` and `availableUntil` are provided (non-null), then `availableFrom` must be strictly earlier than `availableUntil`.
    * **effects**: Creates a new `TimeWindow` entry for the given `resource` or updates an existing one with the specified availability bounds. If `availableFrom` or `availableUntil` is not provided, the corresponding bound is considered indefinite.
  * `getTimeWindow (resource: ResourceID): TimeWindow?`
    * **effects**: Returns the `TimeWindow` entry for the specified `resource`, containing its `resource` ID, `availableFrom`, and `availableUntil` times. Returns `null` if no time window is defined for the resource.
  * `expireResource (resource: ResourceID): Empty`
    * **requires**:
      * A `TimeWindow` entry exists for `resource`.
      * The `availableUntil` for that `resource` is defined (non-null).
      * The `currentTime` (the moment this action is triggered) is greater than or equal to the `availableUntil` value for the `resource`.
    * **effects**: This action serves as an event notification. It explicitly changes no state within this concept. Its occurrence signals to other concepts (via synchronization) that the resource's time-bound availability (as defined by its `availableUntil` property) has ended.

***

**Summary of Latest Changes:**

1. **Simplified State Explanations:** Parenthetical explanations for `resource` have been removed. The specific explanations for `availableFrom` and `availableUntil` remain as requested.
2. **`?` for Optional Types:** All instances of `Optional[DateTime]` have been replaced with `DateTime?`.
3. **Future/Now Requirement for `defineTimeWindow`:** The `requires` clause of `defineTimeWindow` now explicitly checks that any provided (non-null) `availableFrom` or `availableUntil` `DateTime` values are `currentTime` or in the future, preventing the definition of windows that begin or end in the past from the moment of definition.
4. **Simplified `getTimeWindow` Return:** The `getTimeWindow` action now directly returns a `TimeWindow?` object. This implies the `TimeWindow` object carries all the properties defined in the state (`resource`, `availableFrom`, `availableUntil`).

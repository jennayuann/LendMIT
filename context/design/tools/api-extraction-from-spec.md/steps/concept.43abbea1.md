---
timestamp: 'Mon Oct 20 2025 23:02:31 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_230231.c5f288ea.md]]'
content_id: 43abbea1db01b1bf924cfd5d757576f70ee4b109e49e4d71e85349ecf5d8cd7b
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

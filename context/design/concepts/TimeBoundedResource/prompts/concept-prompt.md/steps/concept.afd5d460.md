---
timestamp: 'Thu Oct 16 2025 19:54:51 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_195451.80db247c.md]]'
content_id: afd5d460b223dd9e9a6aa4b7378ce3b31524ac6ef385edf029c787f53f2dc4c6
---

# concept: TimeBoundedResource

* **concept**: TimeBoundedResource \[ResourceID]
* **purpose**: Manage time-based availability and expiration windows for any generic resource.
* **principle**: This concept defines and tracks availability windows (specified by optional start and end times) for resources. It can report a resource's current window and signals when a resource's availability has ended according to its defined `availableUntil` bound.
* **state**:
  * a set of `TimeWindow` entries, each consisting of:
    * `resource`: ResourceID (the unique identifier for the resource this window applies to)
    * `availableFrom`: Optional\[DateTime] (the earliest time the resource is considered available; `null` implies indefinitely available from the past/start)
    * `availableUntil`: Optional\[DateTime] (the latest time the resource is considered available; `null` implies indefinitely available into the future)
* **actions**:
  * `defineTimeWindow (resource: ResourceID, availableFrom: Optional[DateTime], availableUntil: Optional[DateTime]): Empty`
    * **requires**:
      * At least one of `availableFrom` or `availableUntil` must be provided (non-null).
      * If both `availableFrom` and `availableUntil` are provided (non-null), then `availableFrom` must be strictly earlier than `availableUntil`.
    * **effects**: Creates a new `TimeWindow` entry for the given `resource` or updates an existing one with the specified availability bounds. If `availableFrom` or `availableUntil` is not provided, the corresponding bound is considered indefinite.
  * `getTimeWindow (resource: ResourceID): Optional[object { availableFrom: Optional[DateTime], availableUntil: Optional[DateTime] }]`
    * **effects**: Returns an object containing the `availableFrom` and `availableUntil` times for the specified `resource`. Returns `null` if no time window is defined for the resource.
  * `expireResource (resource: ResourceID): Empty`
    * **requires**:
      * A `TimeWindow` entry exists for `resource`.
      * The `availableUntil` for that `resource` is defined (non-null).
      * The `currentTime` (the moment this action is triggered) is greater than or equal to the `availableUntil` value for the `resource`.
    * **effects**: This action serves as an event notification. It explicitly changes no state within this concept. Its occurrence signals to other concepts (via synchronization) that the resource's time-bound availability (as defined by its `availableUntil` property) has ended.

**Explanation of Changes and Adherence to Rubric:**

1. **More General (Optional Bounds):**
   * The `availableFrom` and `availableUntil` fields in the `state` are now `Optional[DateTime]`, allowing for resources that are available indefinitely from a certain point, or until a certain point, or with both bounds.
   * The `defineTimeWindow` action's `requires` clause has been updated to reflect that at least one bound must be provided for the window to be meaningful, and the order constraint for when both are present.
   * The `effects` of `defineTimeWindow` explicitly state how `null` values are interpreted.

2. **Added `getTimeWindow` Action:**
   * A new `getTimeWindow(resource: ResourceID)` action has been added. This provides a symmetric way for other concepts (or a user interface) to query the current availability window of a resource, enhancing usability and adherence to the API-like nature of concepts.

3. **"Take out the system in expireResource":**
   * The explicit `system` keyword has been removed from the `expireResource` action declaration.
   * **Important Interpretation:** Consistent with the "What is a concept?" section (which states "Some actions are performed by users; others are output actions that occur spontaneously under the control of the concept"), `expireResource` is designed to be an *output action* that occurs spontaneously when its `requires` conditions are met (i.e., when a resource's time window closes). It is not intended to be a user-initiated action. Its purpose is to signal an event for synchronizations without explicitly requiring the `system` label.

4. **Adherence to Concept Design Principles:**
   * **Separation of Concerns:** The concept remains tightly focused on time-based resource availability, not conflating with other concerns like user authentication, resource content, or permissions.
   * **Completeness of Functionality:** It fully manages its own state related to time windows and provides all necessary actions/events within its scope, without relying on other concepts to fulfill its core purpose. The `expireResource` event is an internal emission, not a call out to another service.
   * **Independence:** The concept is defined without reference to other specific concepts. `ResourceID` is a generic type, allowing for polymorphism and broad reusability across different applications and resource types.
   * **Reusability and Familiarity:** This generalized `TimeBoundedResource` concept is highly reusable across applications (e.g., for event scheduling, limited-time offers, booking systems) and provides a familiar pattern for handling time constraints.
   * **Purpose and Principle Clarity:** The purpose and principle have been slightly refined to reflect the increased generality and the role of the `expireResource` event.

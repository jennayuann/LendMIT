---
timestamp: 'Thu Oct 16 2025 04:48:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_044815.dfdd94ea.md]]'
content_id: 7ccf5b97551a67ab98a4b00afd6ef460c667b66bfa37f36bc91ecc4221c15077
---

# concept: ResourceStatus

* **concept**: ResourceStatus \[ResourceID]
* **purpose**: Manage explicit lifecycle statuses for a generic resource, allowing it to transition through predefined stages.
* **principle**: A resource can be marked with a specific status (e.g., active, fulfilled, cancelled, expired), and its current status can be queried, enabling external logic to react to its lifecycle stage.
* **state**:
  * a set of `StatusEntries` with
    * `resource` ResourceID
    * `status` of ACTIVE or FULFILLED or CANCELLED or EXPIRED
* **actions**:
  * `markActive (resource: ResourceID): Empty`
    * **requires**: A `StatusEntry` for `resource` does not exist, or its current `status` is not `ACTIVE`.
    * **effects**: Sets the `status` for `resource` to `ACTIVE`. If no entry exists, a new one is created.
  * `markFulfilled (resource: ResourceID): Empty`
    * **requires**: A `StatusEntry` for `resource` exists and its `status` is not `CANCELLED` or `FULFILLED`.
    * **effects**: Sets the `status` for `resource` to `FULFILLED`.
  * `markCancelled (resource: ResourceID): Empty`
    * **requires**: A `StatusEntry` for `resource` exists and its `status` is not `FULFILLED` or `CANCELLED`.
    * **effects**: Sets the `status` for `resource` to `CANCELLED`.
  * `markExpired (resource: ResourceID): Empty`
    * **requires**: A `StatusEntry` for `resource` exists and its `status` is `ACTIVE`.
    * **effects**: Sets the `status` for `resource` to `EXPIRED`.
  * `_getStatus (resource: ResourceID): (status: String)`
    * **requires**: A `StatusEntry` for `resource` exists.
    * **effects**: Returns the current `status` of the `resource`.

***

---
timestamp: 'Thu Oct 16 2025 18:46:44 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_184644.6a3f2088.md]]'
content_id: 192e5c60e48b451b1cb7f8cb3ea0737409e12076d7ec097346e88676458e59b3
---

# Resource Concept:

concept: Resource

* **concept**: Resource \[ResourceID, Owner]
* **purpose**: Represent any generic entity that can be owned and described by basic attributes.
* **principle**: An owner can create a resource, which is then uniquely identified and its descriptive attributes can be retrieved or modified.
* **state**:
  * a set of `Resources` with
    * `id` ResourceID
    * `owner` Owner
    * `name` String?
    * `category` String?
    * `description` String?
* **actions**:
  * `createResource (owner: Owner, name: String?, category: String?, description: String?): (resourceID: ResourceID)`
    * **requires**: None.
    * **effects**: Creates a new `Resource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`. Returns the `id` of the newly created resource.
  * `updateResource (resourceID: ResourceID, name: String?, category: String?, description: String?): Empty`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Updates the `name`, `category`, and/or `description` for the given `resourceID` with the provided non-null values. If a `name`, `category`, or `description` is provided as `null`, it clears the existing value for that attribute.
  * `deleteResource (resourceID: ResourceID): Empty`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Deletes the `Resource` entry corresponding to `resourceID`.
  * `getResource (resourceID: ResourceID): (resource: Resource)`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Returns the `Resource` object associated with this `resourceID`.

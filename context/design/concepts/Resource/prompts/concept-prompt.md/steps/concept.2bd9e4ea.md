---
timestamp: 'Thu Oct 16 2025 18:39:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_183912.0c35e1ef.md]]'
content_id: 2bd9e4ea3d1b205051b504efb6c8dccc8b4515001a850d338e26f5a74a05920e
---

# concept: Resource

* **concept**: Resource \[ResourceID, Owner]
* **purpose**: Represent any generic entity that can be owned and described by basic attributes.
* **principle**: An owner can create a named resource, which is then uniquely identified and its descriptive attributes can be retrieved or modified.
* **state**:
  * a set of `GenericResources` with
    * `id` ResourceID
    * `owner` Owner
    * `name` String
    * `category` String?
    * `description` String?
* **actions**:
  * `createResource (owner: Owner, name: String, category: String?, description: String?): (resourceID: ResourceID)`
    * **requires**: `name` is not an empty string.
    * **effects**: Creates a new `GenericResource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`. Returns the `id` of the newly created resource.
  * `createResource (owner: Owner, name: String, category: String?, description: String?): (error: String)`
    * **requires**: `name` is an empty string.
    * **effects**: Returns an `error` message indicating the name cannot be empty.
  * `updateResource (resourceID: ResourceID, name: String?, category: String?, description: String?): Empty`
    * **requires**: A `GenericResource` entry with `id = resourceID` exists.
    * **effects**: Updates the `name`, `category`, and/or `description` for the given `resourceID` with the provided non-null values.
  * `deleteResource (resourceID: ResourceID): Empty`
    * **requires**: A `GenericResource` entry with `id = resourceID` exists.
    * **effects**: Deletes the `GenericResource` entry corresponding to `resourceID`.
  * `_getResource (resourceID: ResourceID): (owner: Owner, name: String, category: String?, description: String?)`
    * **requires**: A `GenericResource` entry with `id = resourceID` exists.
    * **effects**: Returns the `owner`, `name`, `category`, and `description` of the `GenericResource`.

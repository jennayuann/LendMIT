---
timestamp: 'Tue Oct 21 2025 13:41:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_134149.26c4a5bf.md]]'
content_id: 23a9c44d43dac247b5bfd25888aa2a949603db017edc59627807edf5459dae5a
---

# concept: Resource

* **concept**: Resource \[ResourceID, Owner]
* **purpose**: Represent any generic entity that can be owned and described by a mandatory name and optional attributes.
* **principle**: An owner can create a resource, which is then uniquely identified and named, and its descriptive attributes can be retrieved or modified.
* **state**:
  * a set of `Resources` with
    * `id` ResourceID
    * `owner` Owner
    * `name` String
    * `category` String?
    * `description` String?
* **actions**:
  * `createResource (owner: Owner, name: String, category: String?, description: String?): (resourceID: ResourceID)`
    * **requires**: `name is not an empty string`.
    * **effects**: Creates a new `Resource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`. Returns the `id` of the newly created resource.
  * `updateResource (resourceID: ResourceID, name: String?, category: String?, description: String?): Empty`
    * **requires**:
      * A `Resource` entry with `id = resourceID` exists.
      * If `name` is provided (i.e., not `null`), `name is not an empty string`.
    * **effects**:
      * If `name` is provided and is not an empty string, updates the `name` for the given `resourceID`.
      * If `category` is provided, updates the `category` for the given `resourceID`. If `null` is provided, it clears the existing `category`.
      * If `description` is provided, updates the `description` for the given `resourceID`. If `null` is provided, it clears the existing `description`.
  * `deleteResource (resourceID: ResourceID): Empty`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Deletes the `Resource` entry corresponding to `resourceID`.
  * `getResource (resourceID: ResourceID): (resource: Resource)`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Returns the complete `Resource` object associated with this `resourceID`.

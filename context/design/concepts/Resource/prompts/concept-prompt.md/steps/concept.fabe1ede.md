---
timestamp: 'Thu Oct 16 2025 18:46:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_184658.59421876.md]]'
content_id: fabe1ede5cb08f7955c646a0671f477237cc85932b23d3fee84386b1ed3572ed
---

# concept: Resource

* **concept**: Resource \[ResourceID, Owner]
* **purpose**: Represent any generic entity that can be owned and described by a mandatory name and optional attributes.
* **principle**: An owner can create a resource, which is then uniquely identified and named, and its descriptive attributes (including its name) can be retrieved or modified.
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
      * If `category` is provided (can be `null`), updates the `category` for the given `resourceID`. If `null` is provided, it clears the existing `category`.
      * If `description` is provided (can be `null`), updates the `description` for the given `resourceID`. If `null` is provided, it clears the existing `description`.
  * `deleteResource (resourceID: ResourceID): Empty`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Deletes the `Resource` entry corresponding to `resourceID`.
  * `getResource (resourceID: ResourceID): (resource: Resource)`
    * **requires**: A `Resource` entry with `id = resourceID` exists.
    * **effects**: Returns the complete `Resource` object associated with this `resourceID`, including its `id`, `owner`, `name`, `category`, and `description`.

***

**Summary of Changes and Justification based on Concept Design Principles:**

1. **Name Required**:
   * The `name` attribute in the `state` is now `String` (non-optional).
   * `createResource` now requires a `name: String` parameter and has an explicit `requires: name is not an empty string`.
   * `updateResource` now has a `name: String?` parameter. Its `effects` have been updated to reflect that if `name` is provided, it must be a non-empty string, and it explicitly prevents setting the `name` to `null` or an empty string, as a resource must always have a name. `category` and `description` still correctly allow `null` to clear their values.
2. **`getResource` Naming**:
   * The action name has been changed from `_getResource` to `getResource`, as requested.
3. **`getResource` Return Type**:
   * The `getResource` action now returns the full `Resource` object `(resource: Resource)`, providing all its defined state attributes in a single, coherent object.
4. **Concept Design Rubric Adherence**:
   * **Purpose & Principle**: Updated to clearly state that a name is now mandatory for resources.
   * **State Richness**: The state accurately reflects the new requirement for a mandatory `name`, while `category` and `description` remain optional.
   * **Atomic Actions**: All actions maintain their atomic nature with clear `requires` and `effects`, handling the new `name` requirement consistently.
   * **Independence & Polymorphism**: The `Resource` concept remains independent, dealing only with its core responsibilities of defining, owning, and describing generic entities, without coupling to other concepts for user specifics or complex authorization.
   * **Separation of Concerns & Completeness**: It maintains its focus on generic resource management, ensuring its functionality is complete within its scope and doesn't conflate responsibilities with other potential concepts.

---
timestamp: 'Tue Oct 21 2025 14:02:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_140207.7768f077.md]]'
content_id: dfed6110b0698018bb7803035cde1f1c07edb91db993cc321d199a13a2461035
---

# response:

concept: ResourceIntent

**concept**: ResourceIntent \[ResourceID]

* **purpose**: Associate any resource with a single, application-defined intent label drawn from a configurable vocabulary. This is purely declarative; no lifecycle, timing, ownership, or matching logic is implied.
* **principle**:
  * Intent is a simple label applied to a resource.
  * Valid intent labels are defined and managed within this concept.
  * A resource can have at most one intent label associated with it at any given time.
  * This concept is independent, not depending on or writing to other concepts, enhancing reusability and modularity.
* **state**:
  * a set of `IntentDefinitions` with
    * `intentName` String
  * a set of `IntentEntries` with
    * `resource` ResourceID
    * `intent` String // must reference an existing `IntentDefinition`
* **actions**:
  * `defineIntent(intentName: String): Empty`
    * **requires**:
      * No `IntentDefinition` with `intentName` exists.
    * **effects**:
      * Adds `intentName` to `IntentDefinitions`.
  * `undefineIntent(intentName: String): Empty`
    * **requires**:
      * An `IntentDefinition` for `intentName` exists.
      * No `IntentEntry` uses `intentName`.
    * **effects**:
      * Removes `intentName` from `IntentDefinitions`.
  * `setIntent(resource: ResourceID, intent: String): Empty`
    * **requires**:
      * `intent` must be a defined `IntentDefinition`.
    * **effects**:
      * Creates or updates the `IntentEntry` for `resource` with `intent`.
  * `clearIntent(resource: ResourceID): Empty`
    * **requires**:
      * An `IntentEntry` for `resource` exists.
    * **effects**:
      * Removes the `IntentEntry` for `resource`.
  * `getIntent(resource: ResourceID): { resource: ResourceID, intent: String } | Null`
    * **requires**:
      * True (read-only).
    * **effects**:
      * Returns the `IntentEntry` for `resource`, or `Null` if none exists.
  * `listIntents(): String[]`
    * **requires**:
      * True (read-only).
    * **effects**:
      * Returns all defined `intentName`s.
  * `listResourcesByIntent(intent: String): ResourceID[]`
    * **requires**:
      * `intent` must be a defined `IntentDefinition`.
    * **effects**:
      * Returns `ResourceID`s with the given `intent`.

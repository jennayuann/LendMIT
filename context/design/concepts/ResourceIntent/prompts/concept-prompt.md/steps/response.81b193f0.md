---
timestamp: 'Tue Oct 21 2025 14:00:44 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_140044.c9d43459.md]]'
content_id: 81b193f00baff4475174bcc25dd60d320db502331f4d51d5ccdc316c108e0cae
---

# response:

```markdown
**concept**: ResourceIntent \[ResourceID]

*   **purpose**: Associate any resource with a single, application-defined intent label drawn from a configurable vocabulary. This is purely declarative; no lifecycle, timing, ownership, or matching logic is implied.
*   **principle**:
    *   Intent is a simple label applied to a resource.
    *   The set of valid intent labels is wholly defined and managed within this concept.
    *   A resource can have at most one intent label associated with it at any given time.
    *   This concept is independent; it does not depend on, or internally write to, other concepts, thereby enhancing its reusability and modularity.
*   **state**:
    *   a set of `IntentDefinitions` with
        *   `intentName` String
    *   a set of `IntentEntries` with
        *   `resource` ResourceID
        *   `intent` String // must reference an existing `IntentDefinition`
*   **actions**:
    *   `defineIntent(intentName: String): Empty`
        *   **requires**:
            *   No `IntentDefinition` with the given `intentName` currently exists.
        *   **effects**:
            *   Adds the `intentName` to the set of `IntentDefinitions`.
    *   `undefineIntent(intentName: String): Empty`
        *   **requires**:
            *   An `IntentDefinition` exists for the given `intentName`.
            *   No `IntentEntry` currently uses the `intentName` as its intent.
        *   **effects**:
            *   Removes the `intentName` from the set of `IntentDefinitions`.
    *   `setIntent(resource: ResourceID, intent: String): Empty`
        *   **requires**:
            *   The `intent` String must correspond to an existing `IntentDefinition`.
        *   **effects**:
            *   Creates a new `IntentEntry` for the `resource` with the specified `intent`, or replaces the existing `IntentEntry` for that `resource` if one already exists.
    *   `clearIntent(resource: ResourceID): Empty`
        *   **requires**:
            *   An `IntentEntry` exists for the given `resource`.
        *   **effects**:
            *   Removes the `IntentEntry` associated with the `resource`.
    *   `getIntent(resource: ResourceID): { resource: ResourceID, intent: String } | Null`
        *   **requires**:
            *   True (this is a read-only action).
        *   **effects**:
            *   Returns the current `IntentEntry` for the `resource`, or `Null` if no intent is set for it.
    *   `listIntents(): String[]`
        *   **requires**:
            *   True (this is a read-only action).
        *   **effects**:
            *   Returns a list of all currently defined `intentName`s.
    *   `listResourcesByIntent(intent: String): ResourceID[]`
        *   **requires**:
            *   The `intent` String must correspond to an existing `IntentDefinition`.
        *   **effects**:
            *   Returns a list of all `ResourceID`s that currently have the given `intent` assigned.
```

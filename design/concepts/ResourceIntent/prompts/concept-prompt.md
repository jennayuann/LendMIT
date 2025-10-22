# Important Background:
[@concept-design-overview](../../../background/concept-design-overview.md)
[@concept-specifications](../../../background/concept-specifications.md)
[@concept-rubric](../../../background/detailed/concept-rubric.md)
[@concept-state](../../../background/detailed/concept-state.md)

# ResourceIntent Concept:
[@ResourceIntent](../ResourceIntent.md)

# Example format:
[@ResourceStatus](../../ResourceStatus/ResourceStatus.md)

# Task: Iterate on the ResourceIntent concept.
- Reference the background I provided above, ensuring the concept matches the rubric and the example format.


# response:

```markdown
# concept: ResourceIntent

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

# New response: Iterate on the response above.
- Make sure it follows the example format in simply markdown, not inside a  `code box`.
- Make some wording more concise.
# response:

concept: ResourceIntent

**concept**: ResourceIntent \[ResourceID]

*   **purpose**: Associate any resource with a single, application-defined intent label drawn from a configurable vocabulary. This is purely declarative; no lifecycle, timing, ownership, or matching logic is implied.
*   **principle**:
    *   Intent is a simple label applied to a resource.
    *   Valid intent labels are defined and managed within this concept.
    *   A resource can have at most one intent label associated with it at any given time.
    *   This concept is independent, not depending on or writing to other concepts, enhancing reusability and modularity.
*   **state**:
    *   a set of `IntentDefinitions` with
        *   `intentName` String
    *   a set of `IntentEntries` with
        *   `resource` ResourceID
        *   `intent` String // must reference an existing `IntentDefinition`
*   **actions**:
    *   `defineIntent(intentName: String): Empty`
        *   **requires**:
            *   No `IntentDefinition` with `intentName` exists.
        *   **effects**:
            *   Adds `intentName` to `IntentDefinitions`.
    *   `undefineIntent(intentName: String): Empty`
        *   **requires**:
            *   An `IntentDefinition` for `intentName` exists.
            *   No `IntentEntry` uses `intentName`.
        *   **effects**:
            *   Removes `intentName` from `IntentDefinitions`.
    *   `setIntent(resource: ResourceID, intent: String): Empty`
        *   **requires**:
            *   `intent` must be a defined `IntentDefinition`.
        *   **effects**:
            *   Creates or updates the `IntentEntry` for `resource` with `intent`.
    *   `clearIntent(resource: ResourceID): Empty`
        *   **requires**:
            *   An `IntentEntry` for `resource` exists.
        *   **effects**:
            *   Removes the `IntentEntry` for `resource`.
    *   `getIntent(resource: ResourceID): { resource: ResourceID, intent: String } | Null`
        *   **requires**:
            *   True (read-only).
        *   **effects**:
            *   Returns the `IntentEntry` for `resource`, or `Null` if none exists.
    *   `listIntents(): String[]`
        *   **requires**:
            *   True (read-only).
        *   **effects**:
            *   Returns all defined `intentName`s.
    *   `listResourcesByIntent(intent: String): ResourceID[]`
        *   **requires**:
            *   `intent` must be a defined `IntentDefinition`.
        *   **effects**:
            *   Returns `ResourceID`s with the given `intent`.
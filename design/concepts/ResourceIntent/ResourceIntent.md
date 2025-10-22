# concept: ResourceIntent

**concept**: ResourceIntent \[ResourceID]
*   **purpose**: Associate any resource with an intent.
*   **principle**:
    *   Intent is a simple label applied to a resource.
    *   Valid intent labels are defined and managed within this concept.
    *   A resource can have at most one intent label associated with it at any given time.
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
        *   **effects**:
            *   Returns the `IntentEntry` for `resource`, or `Null` if none exists.
    *   `listIntents(): String[]`
        *   **effects**:
            *   Returns all defined `intentName`s.
    *   `listResourcesByIntent(intent: String): ResourceID[]`
        *   **requires**:
            *   `intent` must be a defined `IntentDefinition`.
        *   **effects**:
            *   Returns `ResourceID`s with the given `intent`.
- **invariants**:
    - **uniqueness**: at most one IntentEntry per resource
    - **referential integrity**: every IntentEntry.intent ∈ IntentDefinitions.intentName
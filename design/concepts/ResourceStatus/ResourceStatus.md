# concept: ResourceStatus

**concept**: ResourceStatus \[ResourceID]
*   **purpose**: Provide a generic and configurable mechanism to manage and track the lifecycle status of any resource type, enforcing application-defined transition rules between states.
*   **principle**: A resource can be marked with any defined status, and its current status can be updated only according to predefined, consistent transition rules. The concept allows the definition of custom status labels and the valid transitions between them.
*   **state**:
    *   a set of `StatusEntries` with
        *   `resource` ResourceID
        *   `currentStatus` String
    *   a set of `StatusDefinitions` with
        *   `statusName` String
    *   a set of `TransitionRules` with
        *   `fromStatus` String
        *   `toStatus` String
*   **actions**:
    *   `defineStatus(statusName: String): Empty`
        *   **requires**: A `StatusDefinition` for `statusName` does not exist.
        *   **effects**: Adds `statusName` to the set of `StatusDefinitions`.
    *   `defineTransition(fromStatus: String, toStatus: String): Empty`
        *   **requires**:
            *   A `StatusDefinition` for `fromStatus` exists.
            *   A `StatusDefinition` for `toStatus` exists.
            *   A `TransitionRule` from `fromStatus` to `toStatus` does not already exist.
        *   **effects**: Adds a `TransitionRule` (from `fromStatus`, to `toStatus`) to the set of `TransitionRules`.
    *   `createEntry(resource: ResourceID, initialStatus: String): Empty`
        *   **requires**:
            *   A `StatusEntry` for `resource` does not exist.
            *   A `StatusDefinition` for `initialStatus` exists.
        *   **effects**: Creates a new `StatusEntry` for `resource` and sets its `currentStatus` to `initialStatus`.
    *   `transition(resource: ResourceID, targetStatus: String): Empty`
        *   **requires**:
            *   A `StatusEntry` for `resource` exists.
            *   A `StatusDefinition` for `targetStatus` exists.
            *   A `TransitionRule` from `currentStatus` to `targetStatus` exists.
        *   **effects**: Updates the `currentStatus` of `resource` to `targetStatus`.
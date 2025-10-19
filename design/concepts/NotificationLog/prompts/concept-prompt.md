# Important Background:
[@concept-design-overview](../../../background/concept-design-overview.md)
[@concept-specifications](../../../background/concept-specifications.md)
[@concept-rubric](../../../background/detailed/concept-rubric.md)
[@concept-state](../../../background/detailed/concept-state.md)

# Initial NotificationLog Concept:
[@NotificationLog](../NotificationLog.md)

# Task: Iterate on the NotificationLog concept.
- Reference the background I provided above, ensuring the concept matches the rubric. 
- Rename payload to something more intuitive, like content or data and add a () explaining that its structured thats why its JSON. 
- Combine logNotification into one action that has two potential returns separated by | that differ depending on the requires and effects.
- Take out requires: true clauses, just leave it blank. 
- Take out underscores in action names.
# response:

# Iterated NotificationLog Concept:

# concept: NotificationLog

*   **concept**: NotificationLog [Recipient, NotificationID]
*   **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
*   **principle**: When an important event occurs, a generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp; it can then be marked as delivered and later dismissed by the recipient.
*   **state**:
    *   a set of `Notifications` with
        *   `id` NotificationID
        *   `recipient` Recipient
        *   `content` JSON (structured JSON data)
        *   `sentAt` DateTime
        *   `deliveredFlag` Boolean = false
        *   `dismissedAt` DateTime?
*   **actions**:
    *   `logNotification (recipient: Recipient, content: JSON): (notificationID: NotificationID) | (error: String)`
        *   **requires**: `content` (structured JSON data)
        *   **effects**:
            *   If `content` is a well-formed JSON string: Creates a new `Notification` entry with a unique `id`, the `recipient`, the `content` string, `sentAt = currentTime`, and `deliveredFlag = false`. Returns the `id` of the new notification.
            *   If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.
    *   `markAsDelivered (notificationID: NotificationID): Empty`
        *   **requires**: A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.
        *   **effects**: Sets `deliveredFlag = true` for the `notificationID`.
    *   `dismissNotification (notificationID: NotificationID): Empty`
        *   **requires**: A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.
        *   **effects**: Sets `dismissedAt = currentTime` for the `notificationID`.
    *   `getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
        *   **requires**:
        *   **effects**: Returns a list of `NotificationID`s for the given `recipient`, optionally filtered by `delivered` status and `dismissedAt` presence (or absence).
---
# Task: Iterate on the above response.
- Take out the requires clause for logNotification
- I think we need an action to clear dismissed notifications. 
- Elaborate on the effects of how getNotifications would work with the filters.
# response:

# Iterated NotificationLog Concept:

# concept: NotificationLog

*   **concept**: NotificationLog \[Recipient, NotificationID]
*   **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
*   **principle**: When an important event occurs, a generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp; it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be permanently cleared.
*   **state**:
    *   a set of `Notifications` with
        *   `id` NotificationID
        *   `recipient` Recipient
        *   `content` JSON (structured JSON data)
        *   `sentAt` DateTime
        *   `deliveredFlag` Boolean = false
        *   `dismissedAt` DateTime?
*   **actions**:
    *   `logNotification (recipient: Recipient, content: JSON): (notificationID: NotificationID) | (error: String)`
        *   **requires**:
        *   **effects**:
            *   If `content` is a well-formed JSON string: Creates a new `Notification` entry with a unique `id`, the `recipient`, the `content` string, `sentAt = currentTime`, and `deliveredFlag = false`. Returns the `id` of the new notification.
            *   If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.
    *   `markAsDelivered (notificationID: NotificationID): Empty`
        *   **requires**: A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.
        *   **effects**: Sets `deliveredFlag = true` for the `notificationID`.
    *   `dismissNotification (notificationID: NotificationID): Empty`
        *   **requires**: A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.
        *   **effects**: Sets `dismissedAt = currentTime` for the `notificationID`.
    *   `clearDismissedNotifications (recipient: Recipient): Empty`
        *   **requires**:
        *   **effects**: Deletes all `Notification` entries for the given `recipient` where `dismissedAt` is set (i.e., `dismissedAt IS NOT NULL`).
    *   `getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
        *   **requires**:
        *   **effects**: Returns a list of `NotificationID`s for the given `recipient`.
            *   If `delivered` is `true`, only notifications where `deliveredFlag` is `true` are included.
            *   If `delivered` is `false`, only notifications where `deliveredFlag` is `false` are included.
            *   If `dismissed` is `true`, only notifications where `dismissedAt` is not `null` are included.
            *   If `dismissed` is `false`, only notifications where `dismissedAt` is `null` are included.
            *   If `delivered` or `dismissed` are `null` (or not provided), their respective filters are not applied.
---
# Task: Iterate on the above response.
- In getNotifications, add in another condition into effects dealing with combinations of filters.
- Delete out the empty requires clauses completely
# response:

# Iterated NotificationLog Concept:

# concept: NotificationLog

*   **concept**: NotificationLog \[Recipient, NotificationID]
*   **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
*   **principle**: When an important event occurs, a generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp; it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be permanently cleared by the recipient.
*   **state**:
    *   a set of `Notifications` with
        *   `id` NotificationID
        *   `recipient` Recipient
        *   `content` JSON (structured JSON data)
        *   `sentAt` DateTime
        *   `deliveredFlag` Boolean = false
        *   `dismissedAt` DateTime?
*   **actions**:
    *   `logNotification (recipient: Recipient, content: JSON): (notificationID: NotificationID) | (error: String)`
        *   **effects**:
            *   If `content` is a well-formed JSON string: Creates a new `Notification` entry with a unique `id`, the `recipient`, the `content` string, `sentAt = currentTime`, and `deliveredFlag = false`. Returns the `id` of the new notification.
            *   If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.
    *   `markAsDelivered (notificationID: NotificationID): Empty`
        *   **requires**: A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.
        *   **effects**: Sets `deliveredFlag = true` for the `notificationID`.
    *   `dismissNotification (notificationID: NotificationID): Empty`
        *   **requires**: A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.
        *   **effects**: Sets `dismissedAt = currentTime` for the `notificationID`.
    *   `clearDismissedNotifications (recipient: Recipient): Empty`
        *   **effects**: Deletes all `Notification` entries for the given `recipient` where `dismissedAt` is set (i.e., `dismissedAt IS NOT NULL`).
    *   `getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
        *   **effects**: Returns a list of `NotificationID`s for the given `recipient` that satisfy all provided filter conditions:
            *   Notifications must match the `delivered` filter: if `delivered` is `true`, `deliveredFlag` must be `true`; if `delivered` is `false`, `deliveredFlag` must be `false`. No filter is applied if `delivered` is `null`.
            *   Notifications must also match the `dismissed` filter: if `dismissed` is `true`, `dismissedAt` must not be `null`; if `dismissed` is `false`, `dismissedAt` must be `null`. No filter is applied if `dismissed` is `null`.
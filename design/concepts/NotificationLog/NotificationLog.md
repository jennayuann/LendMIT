# concept: NotificationLog

*   **concept**: NotificationLog \[Recipient, NotificationID]
*   **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
*   **principle**: A generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp; it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be permanently cleared by the recipient.
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
        *   **effects**: Deletes all `Notification` entries for the given `recipient` where `dismissedAt` is set.
    *   `getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
        *   **effects**: Returns a list of `NotificationID`s for the given `recipient` that satisfy all provided filter conditions:
            *   Notifications must match the `delivered` filter: if `delivered` is `true`, `deliveredFlag` must be `true`; if `delivered` is `false`, `deliveredFlag` must be `false`. No filter is applied if `delivered` is `null`.
            *   Notifications must also match the `dismissed` filter: if `dismissed` is `true`, `dismissedAt` must not be `null`; if `dismissed` is `false`, `dismissedAt` must be `null`. No filter is applied if `dismissed` is `null`.
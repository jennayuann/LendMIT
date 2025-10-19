---
timestamp: 'Thu Oct 16 2025 20:48:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_204806.2916c47f.md]]'
content_id: 4514f39c519d3c93295433bc0cf53f5a2918d11556db53ec6b282fcec6d9a2cf
---

# concept: NotificationLog

* **concept**: NotificationLog \[Recipient, NotificationID]
* **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
* **principle**: When an important event occurs, a generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp; it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be permanently cleared.
* **state**:
  * a set of `Notifications` with
    * `id` NotificationID
    * `recipient` Recipient
    * `content` JSON (structured JSON data)
    * `sentAt` DateTime
    * `deliveredFlag` Boolean = false
    * `dismissedAt` DateTime?
* **actions**:
  * `logNotification (recipient: Recipient, content: JSON): (notificationID: NotificationID) | (error: String)`
    * **requires**:
    * **effects**:
      * If `content` is a well-formed JSON string: Creates a new `Notification` entry with a unique `id`, the `recipient`, the `content` string, `sentAt = currentTime`, and `deliveredFlag = false`. Returns the `id` of the new notification.
      * If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.
  * `markAsDelivered (notificationID: NotificationID): Empty`
    * **requires**: A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.
    * **effects**: Sets `deliveredFlag = true` for the `notificationID`.
  * `dismissNotification (notificationID: NotificationID): Empty`
    * **requires**: A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.
    * **effects**: Sets `dismissedAt = currentTime` for the `notificationID`.
  * `clearDismissedNotifications (recipient: Recipient): Empty`
    * **requires**:
    * **effects**: Deletes all `Notification` entries for the given `recipient` where `dismissedAt` is set (i.e., `dismissedAt IS NOT NULL`).
  * `getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
    * **requires**:
    * **effects**: Returns a list of `NotificationID`s for the given `recipient`.
      * If `delivered` is `true`, only notifications where `deliveredFlag` is `true` are included.
      * If `delivered` is `false`, only notifications where `deliveredFlag` is `false` are included.
      * If `dismissed` is `true`, only notifications where `dismissedAt` is not `null` are included.
      * If `dismissed` is `false`, only notifications where `dismissedAt` is `null` are included.
      * If `delivered` or `dismissed` are `null` (or not provided), their respective filters are not applied.

***

---
timestamp: 'Thu Oct 16 2025 04:48:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_044815.dfdd94ea.md]]'
content_id: ee78be28f63bbb65c55299684e072e001600cf0aeae022301dff6dd00299de87
---

# concept: NotificationLog

* **concept**: NotificationLog \[Recipient, NotificationID]
* **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
* **principle**: When an important event occurs, a generic notification is logged for a recipient, recording its payload and timestamp; it can then be marked as delivered and later dismissed by the recipient.
* **state**:
  * a set of `Notifications` with
    * `id` NotificationID
    * `recipient` Recipient
    * `payload` JSON
    * `sentAt` DateTime
    * `deliveredFlag` Boolean = false
    * `dismissedAt` DateTime?
* **actions**:
  * `logNotification (recipient: Recipient, payload: JSON): (notificationID: NotificationID)`
    * **requires**: `payload` is a well-formed JSON string.
    * **effects**: Creates a new `Notification` entry with a unique `id`, the `recipient`, the `payload` as a string, `sentAt = currentTime`, and `deliveredFlag = false`. Returns the `id` of the new notification.
  * `logNotification (recipient: Recipient, payload: JSON): (error: String)`
    * **requires**: `payload` is not a well-formed JSON string.
    * **effects**: Returns an `error` message indicating an invalid payload.
  * `markAsDelivered (notificationID: NotificationID): Empty`
    * **requires**: A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.
    * **effects**: Sets `deliveredFlag = true` for the `notificationID`.
  * `dismissNotification (notificationID: NotificationID): Empty`
    * **requires**: A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.
    * **effects**: Sets `dismissedAt = currentTime` for the `notificationID`.
  * `_getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
    * **requires**: `true`.
    * **effects**: Returns a list of `NotificationID`s for the given `recipient`, optionally filtered by `delivered` status and `dismissedAt` presence (or absence).

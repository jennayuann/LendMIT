---
timestamp: 'Thu Oct 16 2025 20:44:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_204447.f7f68ff6.md]]'
content_id: 54ae4f8a443addd5d1288fb3554ce3a0c248abe9b5312c30a3843ff28429abb1
---

# concept: NotificationLog

* **concept**: NotificationLog \[Recipient, NotificationID]
* **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
* **principle**: When an important event occurs, a generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp; it can then be marked as delivered and later dismissed by the recipient.
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
    * **requires**: `content` (structured JSON data)
    * **effects**:
      * If `content` is a well-formed JSON string: Creates a new `Notification` entry with a unique `id`, the `recipient`, the `content` string, `sentAt = currentTime`, and `deliveredFlag = false`. Returns the `id` of the new notification.
      * If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.
  * `markAsDelivered (notificationID: NotificationID): Empty`
    * **requires**: A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.
    * **effects**: Sets `deliveredFlag = true` for the `notificationID`.
  * `dismissNotification (notificationID: NotificationID): Empty`
    * **requires**: A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.
    * **effects**: Sets `dismissedAt = currentTime` for the `notificationID`.
  * `getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
    * **requires**:
    * **effects**: Returns a list of `NotificationID`s for the given `recipient`, optionally filtered by `delivered` status and `dismissedAt` presence (or absence).

***

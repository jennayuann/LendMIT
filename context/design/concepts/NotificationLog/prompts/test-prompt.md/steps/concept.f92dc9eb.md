---
timestamp: 'Sat Oct 18 2025 00:37:56 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_003756.82ec7e7d.md]]'
content_id: f92dc9ebf11e8fd243efeb7ccf8b58b6ac162df99443cc493df558a4c3f1ffc5
---

# concept: NotificationLog

* **concept**: NotificationLog \[Recipient, NotificationID]
* **purpose**: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
* **principle**: A generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp; it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be permanently cleared by the recipient.
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
    * **effects**: Deletes all `Notification` entries for the given `recipient` where `dismissedAt` is set.
  * `getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])`
    * **effects**: Returns a list of `NotificationID`s for the given `recipient` that satisfy all provided filter conditions:
      * Notifications must match the `delivered` filter: if `delivered` is `true`, `deliveredFlag` must be `true`; if `delivered` is `false`, `deliveredFlag` must be `false`. No filter is applied if `delivered` is `null`.
      * Notifications must also match the `dismissed` filter: if `dismissed` is `true`, `dismissedAt` must not be `null`; if `dismissed` is `false`, `dismissedAt` must be `null`. No filter is applied if `dismissed` is `null`.

## Implementation of concept to write tests for:

```
// src/concepts/NotificationLog.ts

  

import { Collection, Db } from "mongodb";

import { ID } from "@/utils/types.ts";

import { freshID } from "@/utils/database.ts";

import { db } from "@/db/connection.ts";

  

// ----------------------------------------------------------------------

// Type Definitions

// ----------------------------------------------------------------------

type Recipient = ID;

type NotificationID = ID;

  

interface Notification {

_id: NotificationID;

recipient: Recipient;

content: string;

sentAt: Date;

deliveredFlag: boolean;

dismissedAt?: Date; // optional, only exists if dismissed

}

  

/**

* concept: NotificationLog [Recipient, NotificationID]

* purpose: Log, manage, and track the status of generic event-driven alerts or messages for recipients.

* principle: A generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp;

* it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be

* permanently cleared by the recipient.

*/

export class NotificationLog {

private notifications: Collection<Notification>;

  

constructor(private readonly database: Db) {

this.notifications = this.database.collection<Notification>("notifications");

}

  

/**

* logNotification(recipient, content)

* - Validates JSON

* - Creates and stores a new notification

*/

async logNotification(

{ recipient, content }: { recipient: Recipient; content: string },

): Promise<{ notificationID: NotificationID } | { error: string }> {

// Validate JSON content is a valid object (not just any JSON value)

let parsed;

try {

parsed = JSON.parse(content);

if (typeof parsed !== "object" || parsed === null) {

return { error: "Content must be a JSON object." };

}

} catch (error) {

const message = error instanceof Error ? error.message : String(error);

return { error: `Invalid JSON content: ${message}` };

}

  

const newNotification: Notification = {

_id: freshID(),

recipient,

content,

sentAt: new Date(),

deliveredFlag: false,

};

  

await this.notifications.insertOne(newNotification);

return { notificationID: newNotification._id };

}

  

/**

* markAsDelivered(notificationID)

* requires: notification exists and not yet delivered

* effects: sets deliveredFlag = true

*/

async markAsDelivered(

{ notificationID }: { notificationID: NotificationID },

): Promise<void> {

const notification = await this.notifications.findOne({ _id: notificationID });

if (!notification) throw new Error("Notification not found.");

if (notification.deliveredFlag) throw new Error("Notification already delivered.");

  

await this.notifications.updateOne(

{ _id: notificationID },

{ $set: { deliveredFlag: true } },

);

}

  

/**

* dismissNotification(notificationID)

* requires: notification exists and not yet dismissed

* effects: sets dismissedAt = now

*/

async dismissNotification(

{ notificationID }: { notificationID: NotificationID },

): Promise<void> {

const notification = await this.notifications.findOne({ _id: notificationID });

if (!notification) throw new Error("Notification not found.");

if (notification.dismissedAt) throw new Error("Notification already dismissed.");

  

await this.notifications.updateOne(

{ _id: notificationID },

{ $set: { dismissedAt: new Date() } },

);

}

  

/**

* clearDismissedNotifications(recipient)

* effects: deletes all dismissed notifications for the given recipient

*/

async clearDismissedNotifications(

{ recipient }: { recipient: Recipient },

): Promise<void> {

await this.notifications.deleteMany({

recipient,

dismissedAt: { $exists: true },

});

}

  

/**

* getNotifications(recipient, delivered?, dismissed?)

* effects: returns all notifications for recipient matching filters

*/

async getNotifications(

{ recipient, delivered, dismissed }: {

recipient: Recipient;

delivered?: boolean;

dismissed?: boolean;

},

): Promise<{ notificationIDs: NotificationID[] }> {

const query: Record<string, unknown> = { recipient };

  

// Delivered filter

if (delivered !== undefined) query.deliveredFlag = delivered;

  

// Dismissed filter

if (dismissed !== undefined) {

query.dismissedAt =

dismissed ? { $exists: true } : { $exists: false };

}

  

const notificationIDs = await this.notifications

.find(query, { projection: { _id: 1 } })

.map((doc) => doc._id)

.toArray();

  

return { notificationIDs };

}

}

  

// Export singleton instance

export const notificationLog = new NotificationLog(db);
```

## utils/types.ts:

```
declare const Brand: unique symbol;

  

/**

* Generic ID: effectively a string,

* but uses type branding.

*/

export type ID = string & { [Brand]: true };

  

/**

* Empty record type: enforces no entries.

*/

export type Empty = Record<PropertyKey, never>;
```

---
timestamp: 'Sat Oct 18 2025 00:23:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_002321.c2c8e355.md]]'
content_id: 2fbc8026b5ea025f67158e2ee6b5ec461b08d547e493ab1511ca413f28e5e2eb
---

# response:

```typescript
// src/concepts/NotificationLog.ts

import { Collection, Db } from "npm:mongodb";
import { db } from "../db/connection.ts"; // Adjusted path to connection.ts
import { ID, Empty } from "../utils/types.ts"; // Assuming utils are sibling to concepts
import { freshID } from "../utils/database.ts"; // Assuming utils are sibling to concepts

// 1. Define branded ID types for clarity and type safety
type Recipient = ID;
type NotificationID = ID;

// 2. Define the interface for the Notification document, matching the concept's state
// The MongoDB collection name will be "notifications" (plural of NotificationLog)
interface Notification {
  _id: NotificationID; // Mapped from concept's 'id'
  recipient: Recipient;
  content: string; // JSON content stored as a string
  sentAt: Date;
  deliveredFlag: boolean;
  dismissedAt?: Date; // Optional field
}

/**
 * concept: NotificationLog [Recipient, NotificationID]
 * purpose: Log, manage, and track the status of generic event-driven alerts or messages for recipients.
 * principle: A generic notification is logged for a recipient, recording its content (structured JSON data) and timestamp;
 *            it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be
 *            permanently cleared by the recipient.
 */
export class NotificationLog {
  private notifications: Collection<Notification>;

  constructor(private readonly database: Db) {
    // MongoDB collection name should be the plural form of the concept
    this.notifications = this.database.collection<Notification>("notifications");
  }

  /**
   * logNotification (recipient: Recipient, content: JSON): (notificationID: NotificationID) | (error: String)
   * effects:
   *   If `content` is a well-formed JSON string: Creates a new `Notification` entry with a unique `id`,
   *   the `recipient`, the `content` string, `sentAt = currentTime`, and `deliveredFlag = false`.
   *   Returns the `id` of the new notification.
   *   If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.
   */
  async logNotification(
    { recipient, content }: { recipient: Recipient; content: string },
  ): Promise<{ notificationID: NotificationID } | { error: string }> {
    // Enforce: If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.
    try {
      JSON.parse(content);
    } catch (e) {
      return { error: `Invalid JSON content: ${e.message}` };
    }

    const newNotification: Notification = {
      _id: freshID(), // Use freshID for unique ID
      recipient,
      content,
      sentAt: new Date(), // currentTime
      deliveredFlag: false,
      dismissedAt: undefined, // Initially not dismissed
    };

    await this.notifications.insertOne(newNotification);

    return { notificationID: newNotification._id };
  }

  /**
   * markAsDelivered (notificationID: NotificationID): Empty
   * requires: A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.
   * effects: Sets `deliveredFlag = true` for the `notificationID`.
   */
  async markAsDelivered(
    { notificationID }: { notificationID: NotificationID },
  ): Promise<Empty> {
    // Enforce requires conditions
    const notification = await this.notifications.findOne({
      _id: notificationID,
    });

    if (!notification) {
      throw new Error(
        `Notification with ID '${notificationID}' not found.`,
      );
    }
    if (notification.deliveredFlag === true) {
      throw new Error(
        `Notification with ID '${notificationID}' is already marked as delivered.`,
      );
    }

    // Perform effects
    await this.notifications.updateOne(
      { _id: notificationID },
      { $set: { deliveredFlag: true } },
    );

    return {};
  }

  /**
   * dismissNotification (notificationID: NotificationID): Empty
   * requires: A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.
   * effects: Sets `dismissedAt = currentTime` for the `notificationID`.
   */
  async dismissNotification(
    { notificationID }: { notificationID: NotificationID },
  ): Promise<Empty> {
    // Enforce requires conditions
    const notification = await this.notifications.findOne({
      _id: notificationID,
    });

    if (!notification) {
      throw new Error(
        `Notification with ID '${notificationID}' not found.`,
      );
    }
    if (notification.dismissedAt !== undefined) {
      throw new Error(
        `Notification with ID '${notificationID}' is already dismissed.`,
      );
    }

    // Perform effects
    await this.notifications.updateOne(
      { _id: notificationID },
      { $set: { dismissedAt: new Date() } }, // currentTime
    );

    return {};
  }

  /**
   * clearDismissedNotifications (recipient: Recipient): Empty
   * effects: Deletes all `Notification` entries for the given `recipient` where `dismissedAt` is set.
   */
  async clearDismissedNotifications(
    { recipient }: { recipient: Recipient },
  ): Promise<Empty> {
    // Perform effects
    await this.notifications.deleteMany({
      recipient: recipient,
      dismissedAt: { $ne: undefined }, // $ne: null would also work, assuming undefined is stored as null
    });

    return {};
  }

  /**
   * getNotifications (recipient: Recipient, delivered: Boolean?, dismissed: Boolean?): (notificationIDs: NotificationID[])
   * effects: Returns a list of `NotificationID`s for the given `recipient` that satisfy all provided filter conditions:
   *   - Notifications must match the `delivered` filter: if `delivered` is `true`, `deliveredFlag` must be `true`;
   *     if `delivered` is `false`, `deliveredFlag` must be `false`. No filter is applied if `delivered` is `null`.
   *   - Notifications must also match the `dismissed` filter: if `dismissed` is `true`, `dismissedAt` must not be `null`;
   *     if `dismissed` is `false`, `dismissedAt` must be `null`. No filter is applied if `dismissed` is `null`.
   */
  async getNotifications(
    { recipient, delivered, dismissed }: {
      recipient: Recipient;
      delivered?: boolean;
      dismissed?: boolean;
    },
  ): Promise<{ notificationIDs: NotificationID[] }> {
    const query: Record<string, unknown> = { recipient: recipient };

    // Apply 'delivered' filter
    if (delivered !== undefined) {
      query.deliveredFlag = delivered;
    }

    // Apply 'dismissed' filter
    if (dismissed !== undefined) {
      if (dismissed === true) {
        query.dismissedAt = { $ne: undefined }; // not null/undefined
      } else {
        query.dismissedAt = undefined; // null/undefined
      }
    }

    // Perform effects
    const notificationIDs = await this.notifications.find(query, {
      projection: { _id: 1 },
    })
      .map((doc) => doc._id)
      .toArray();

    return { notificationIDs };
  }
}

// Export the instantiated class
export const notificationLog = new NotificationLog(db);
```

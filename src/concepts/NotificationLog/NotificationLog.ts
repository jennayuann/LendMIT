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
 *            it can then be marked as delivered and later dismissed by the recipient. Dismissed notifications can be
 *            permanently cleared by the recipient.
 */
export class NotificationLog {
  private notifications: Collection<Notification>;

  constructor(private readonly database: Db) {
    this.notifications =
      this.database.collection<Notification>("notifications");
  }

  /**
   * logNotification(recipient, content)
   * - Validates JSON
   * - Creates and stores a new notification
   */
  async logNotification({
    recipient,
    content,
  }: {
    recipient: Recipient;
    content: string;
  }): Promise<{ notificationID: NotificationID } | { error: string }> {
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
  async markAsDelivered({
    notificationID,
  }: {
    notificationID: NotificationID;
  }): Promise<void> {
    const notification = await this.notifications.findOne({
      _id: notificationID,
    });
    if (!notification) throw new Error("Notification not found.");
    if (notification.deliveredFlag)
      throw new Error("Notification already delivered.");

    await this.notifications.updateOne(
      { _id: notificationID },
      { $set: { deliveredFlag: true } }
    );
  }

  /**
   * dismissNotification(notificationID)
   * requires: notification exists and not yet dismissed
   * effects: sets dismissedAt = now
   */
  async dismissNotification({
    notificationID,
  }: {
    notificationID: NotificationID;
  }): Promise<void> {
    // Atomically set dismissedAt only if it hasn't been set yet, avoid race conditions
    const result = await this.notifications.updateOne(
      { _id: notificationID, dismissedAt: { $exists: false } },
      { $set: { dismissedAt: new Date() } }
    );

    // Nothing was matched or modified
    if (result.matchedCount === 0) {
      // Check whether it's missing or already dismissed
      const existing = await this.notifications.findOne({
        _id: notificationID,
      });
      if (!existing) throw new Error("Notification not found.");
      if (existing.dismissedAt)
        throw new Error("Notification already dismissed.");
      throw new Error("Unexpected dismissal state.");
    }
  }

  /**
   * getNotificationWithContent(notificationID)
   * effects: returns a single notification with parsed content and metadata
   */
  async getNotificationWithContent({
    notificationID,
  }: {
    notificationID: NotificationID;
  }): Promise<{
    notification?: {
      id: NotificationID;
      content: Record<string, unknown> | null;
      rawContent?: string;
      sentAt: Date;
      delivered: boolean;
      dismissedAt?: Date;
    };
  }> {
    const n = await this.notifications.findOne({ _id: notificationID });
    if (!n) return {};
    let parsed: Record<string, unknown> | null = null;
    let raw: string | undefined;
    try {
      const p = JSON.parse(n.content);
      parsed =
        typeof p === "object" && p !== null
          ? (p as Record<string, unknown>)
          : null;
      if (!parsed) raw = n.content;
    } catch {
      parsed = null;
      raw = n.content;
    }
    return {
      notification: {
        id: n._id,
        content: parsed,
        rawContent: raw,
        sentAt: n.sentAt,
        delivered: !!n.deliveredFlag,
        dismissedAt: n.dismissedAt,
      },
    };
  }

  /**
   * clearDismissedNotifications(recipient)
   * effects: deletes all dismissed notifications for the given recipient
   */
  async clearDismissedNotifications({
    recipient,
  }: {
    recipient: Recipient;
  }): Promise<void> {
    await this.notifications.deleteMany({
      recipient,
      dismissedAt: { $exists: true },
    });
  }

  /**
   * getNotifications(recipient, delivered?, dismissed?)
   * effects: returns all notifications for recipient matching filters
   */
  async getNotifications({
    recipient,
    delivered,
    dismissed,
  }: {
    recipient: Recipient;
    delivered?: boolean;
    dismissed?: boolean;
  }): Promise<{ notificationIDs: NotificationID[] }> {
    const query: Record<string, unknown> = { recipient };

    // Delivered filter
    if (delivered !== undefined) query.deliveredFlag = delivered;

    // Dismissed filter
    if (dismissed !== undefined) {
      query.dismissedAt = dismissed ? { $exists: true } : { $exists: false };
    }

    const notificationIDs = await this.notifications
      .find(query, { projection: { _id: 1 } })
      .map((doc) => doc._id)
      .toArray();

    return { notificationIDs };
  }

  /**
   * listNotificationsWithContent(recipient, delivered?, dismissed?)
   * effects: returns all notifications for recipient matching filters with parsed content and metadata
   */
  async listNotificationsWithContent({
    recipient,
    delivered,
    dismissed,
  }: {
    recipient: Recipient;
    delivered?: boolean;
    dismissed?: boolean;
  }): Promise<{
    notifications: Array<{
      id: NotificationID;
      content: Record<string, unknown> | null;
      rawContent?: string; // included if JSON parse fails
      sentAt: Date;
      delivered: boolean;
      dismissedAt?: Date;
    }>;
  }> {
    const query: Record<string, unknown> = { recipient };
    if (delivered !== undefined) query.deliveredFlag = delivered;
    if (dismissed !== undefined) {
      query.dismissedAt = dismissed ? { $exists: true } : { $exists: false };
    }

    const docs = await this.notifications
      .find(query, {
        projection: {
          _id: 1,
          content: 1,
          sentAt: 1,
          deliveredFlag: 1,
          dismissedAt: 1,
        },
      })
      .sort({ sentAt: -1 })
      .toArray();

    const notifications = docs.map((n) => {
      let parsed: Record<string, unknown> | null = null;
      let raw: string | undefined;
      try {
        const p = JSON.parse(n.content);
        parsed =
          typeof p === "object" && p !== null
            ? (p as Record<string, unknown>)
            : null;
        if (!parsed) raw = n.content;
      } catch {
        parsed = null;
        raw = n.content;
      }
      return {
        id: n._id,
        content: parsed,
        rawContent: raw,
        sentAt: n.sentAt,
        delivered: !!n.deliveredFlag,
        dismissedAt: n.dismissedAt,
      };
    });

    return { notifications };
  }
}

// Export singleton instance
export const notificationLog = new NotificationLog(db);

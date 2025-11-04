import type { ID } from "@/utils/types.ts";

// Minimal interfaces for the dependencies to keep this helper easily testable
export interface FollowingLike {
  getFollowers(input: { followee: ID } | ID): Promise<{ followerIDs: ID[] }>;
}

export interface NotificationLogLike {
  logNotification(input: {
    recipient: ID;
    content: string;
  }): Promise<{ notificationID: ID } | { error: string }>;
}

export interface CategoryPostPayload {
  owner: ID;
  category?: string | null;
  resourceID: ID;
  name: string;
  description?: string | null;
}

/**
 * Fan out a "new post in category" notification to all followers of the category.
 * - Skips when category is missing/empty
 * - Excludes the owner from notifications
 * - Returns counts for observability; does not throw on individual failures
 */
export async function fanOutCategoryPost(
  payload: CategoryPostPayload,
  deps: { following: FollowingLike; notificationLog: NotificationLogLike }
): Promise<{ attempted: number; notified: number }> {
  const { owner, category, resourceID, name, description } = payload;
  const cat = typeof category === "string" ? category.trim() : "";
  if (!cat) return { attempted: 0, notified: 0 };

  const { followerIDs } = await deps.following.getFollowers({
    followee: cat as ID,
  });
  const recipients = followerIDs.filter((id) => id !== owner);

  if (recipients.length === 0) return { attempted: 0, notified: 0 };

  const contentObject: Record<string, unknown> = {
    type: "category_post",
    category: cat,
    resourceID,
    owner,
    name,
  };
  if (description != null) contentObject.description = description;

  const content = JSON.stringify(contentObject);

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      deps.notificationLog.logNotification({ recipient, content })
    )
  );

  let notified = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && "notificationID" in r.value) {
      notified += 1;
    } else if (r.status === "fulfilled" && "error" in r.value) {
      console.warn(
        `[Notifications] Failed to log for recipient due to content error: ${r.value.error}`
      );
    } else if (r.status === "rejected") {
      console.warn(`[Notifications] Failed to log notification: ${r.reason}`);
    }
  }

  return { attempted: recipients.length, notified };
}

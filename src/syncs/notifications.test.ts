// src/syncs/notifications.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@/utils/database.ts";
import { Following } from "@/concepts/Following/Following.ts";
import { NotificationLog } from "@/concepts/NotificationLog/NotificationLog.ts";
import type { ID } from "@/utils/types.ts";
import { fanOutCategoryPost } from "./notifications.ts";

Deno.test({
  name: "notifications fan-out: notifies followers of category and excludes owner",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const [db, client] = await testDb();
    const following = new Following(db);
    const notificationLog = new NotificationLog(db);

    const owner = "owner-1" as ID;
    const a = "user-a" as ID;
    const b = "user-b" as ID;
    const c = "user-c" as ID;
    const category = "category-101" as ID; // categories are just IDs/strings

    // a, b, and owner all follow category; c does not
    await following.follow({ follower: a, followee: category });
    await following.follow({ follower: b, followee: category });
    await following.follow({ follower: owner, followee: category });

    const resourceID = "res-xyz" as ID;

    const result = await fanOutCategoryPost(
      {
        owner,
        category,
        resourceID,
        name: "Post Title",
        description: "Details",
      },
      { following, notificationLog }
    );

    // attempted should be 2 (a and b), owner excluded
    assertEquals(result.attempted, 2);
    assertEquals(result.notified, 2);

    const aIDs = await notificationLog.getNotifications({ recipient: a });
    const bIDs = await notificationLog.getNotifications({ recipient: b });
    const ownerIDs = await notificationLog.getNotifications({
      recipient: owner,
    });
    const cIDs = await notificationLog.getNotifications({ recipient: c });

    assertEquals(aIDs.notificationIDs.length, 1);
    assertEquals(bIDs.notificationIDs.length, 1);
    assertEquals(ownerIDs.notificationIDs.length, 0);
    assertEquals(cIDs.notificationIDs.length, 0);

    await client.close();
  },
});

Deno.test({
  name: "notifications fan-out: no-op when category missing/empty",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const [db, client] = await testDb();
    const following = new Following(db);
    const notificationLog = new NotificationLog(db);

    const owner = "owner-2" as ID;

    const r1 = await fanOutCategoryPost(
      { owner, category: undefined, resourceID: "res1" as ID, name: "NoCat" },
      { following, notificationLog }
    );
    assertEquals(r1.attempted, 0);
    assertEquals(r1.notified, 0);

    const r2 = await fanOutCategoryPost(
      { owner, category: "   ", resourceID: "res2" as ID, name: "BlankCat" },
      { following, notificationLog }
    );
    assertEquals(r2.attempted, 0);
    assertEquals(r2.notified, 0);

    await client.close();
  },
});

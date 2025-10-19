---
timestamp: 'Fri Oct 17 2025 22:55:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_225547.60801772.md]]'
content_id: 3078225f858f2076e866f4cd3d464744213bf4ef75605f8611684afd2f9cfc4b
---

# Example structure:

```
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Following } from "@concepts/Following.ts";

Deno.test("Following concept", async () => {
  const [db, client] = await testDb();
  const following = new Following(db);

  // ✅ Happy path
  await following.follow("userA", "userB");
  const { isFollowing } = await following.isFollowing("userA", "userB");
  assertEquals(isFollowing, true);

  // ❌ Requires violation
  await assertRejects(() => following.follow("userA", "userA"), Error, "Cannot follow yourself.");

  // 🧩 Edge case: unfollowing someone not followed
  await assertRejects(() => following.unfollow("userA", "userC"), Error);

  // # trace: Demonstrates the full principle
  await following.follow("userB", "userC");
  await following.unfollow("userA", "userB");
  const result = await following.getFollowers("userC");
  assertEquals(result.followerIDs.includes("userB"), true);

  await client.close();
});
```

## Guide for testing concepts:

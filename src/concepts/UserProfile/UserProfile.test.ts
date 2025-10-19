// src/concepts/UserProfile.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { UserProfile } from "./UserProfile.ts";
import { Collection, Db } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const user1 = "user1" as ID;
const user2 = "user2" as ID;
const user3 = "user3" as ID;
const nonExistentUser = "nonExistentUser" as ID;
const emptyID = "" as ID;

// Expected profile structure for direct DB checks
interface ProfileDoc {
  _id: ID;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  thumbnail: string | null;
}

// Modify the UserProfile class to accept a Db instance for testing purposes
// (This modification should ideally be done in UserProfile.ts itself for testability)
class TestableUserProfile extends UserProfile {
  constructor(dbInstance: Db) {
    super(); // Call original constructor
    // Override the collection property to use the testDb instance
    // This requires `userProfiles` to be `protected` or `public` in the original class,
    // or provide a setter. For the purpose of this test, we'll assume direct access
    // or a minor internal adjustment is possible in a real scenario.
    // A more robust solution would be to pass `dbInstance` to the `UserProfile` constructor directly.
    // For this test, let's instantiate the original UserProfile and then *patch* its collection.
    // This is a workaround for the current `UserProfile` implementation not taking `db` in its constructor.
    // In a real project, the `UserProfile` constructor should take `db: Db` as an argument.
    Object.defineProperty(this, "userProfiles", {
      value: dbInstance.collection<ProfileDoc>("userprofiles"),
      writable: true,
      configurable: true,
    });
  }
}

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR USERPROFILE CONCEPT");
console.log("===========================================\n");

// ----------------------------------------------------------------------
// CREATE PROFILE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "UserProfile concept: Unit tests for 'createProfile' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: CREATE PROFILE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const userProfile = new TestableUserProfile(db);
    const coll: Collection<ProfileDoc> = db.collection("userprofiles");
    await coll.deleteMany({}); // Reset DB for this test group

    await t.step(
      "✅ Happy path: Create a profile with all fields",
      async () => {
        await userProfile.createProfile({
          user: user1,
          firstName: "John",
          lastName: "Doe",
          bio: "A simple bio.",
          thumbnail: "http://example.com/john.png",
        });

        const profile = await userProfile.getProfile({ user: user1 });
        assertEquals(profile._id, user1);
        assertEquals(profile.firstName, "John");
        assertEquals(profile.lastName, "Doe");
        assertEquals(profile.bio, "A simple bio.");
        assertEquals(profile.thumbnail, "http://example.com/john.png");

        const dbEntry = await coll.findOne({ _id: user1 });
        assertEquals(dbEntry, profile);
      },
    );

    await t.step(
      "✅ Happy path: Create a profile with only required fields",
      async () => {
        await userProfile.createProfile({
          user: user2,
          firstName: "Jane",
          lastName: "Smith",
        });

        const profile = await userProfile.getProfile({ user: user2 });
        assertEquals(profile._id, user2);
        assertEquals(profile.firstName, "Jane");
        assertEquals(profile.lastName, "Smith");
        assertEquals(profile.bio, null);
        assertEquals(profile.thumbnail, null);

        const dbEntry = await coll.findOne({ _id: user2 });
        assertEquals(dbEntry, profile);
      },
    );

    await t.step(
      "✅ Requires violation: Cannot create profile for an existing user",
      async () => {
        // user1 already created in first step
        await assertRejects(
          () =>
            userProfile.createProfile({
              user: user1,
              firstName: "Duplicate",
              lastName: "User",
            }),
          Error,
          `UserProfile for user ${user1} already exists.`,
        );

        const count = await coll.countDocuments({ _id: user1 });
        assertEquals(count, 1); // Should still only have one entry for user1
      },
    );

    await t.step(
      "✅ Edge case: Create profile with empty string ID",
      async () => {
        await userProfile.createProfile({
          user: emptyID,
          firstName: "Empty",
          lastName: "ID",
        });

        const profile = await userProfile.getProfile({ user: emptyID });
        assertEquals(profile._id, emptyID);
        assertEquals(profile.firstName, "Empty");
        assertEquals(profile.lastName, "ID");
      },
    );

    await t.step(
      "✅ Edge case: Create profile with empty string for names/bio/thumbnail",
      async () => {
        await userProfile.createProfile({
          user: user3,
          firstName: "",
          lastName: "",
          bio: "",
          thumbnail: "",
        });

        const profile = await userProfile.getProfile({ user: user3 });
        assertEquals(profile._id, user3);
        assertEquals(profile.firstName, "");
        assertEquals(profile.lastName, "");
        assertEquals(profile.bio, "");
        assertEquals(profile.thumbnail, "");
      },
    );

    await client.close();
    console.log("✅ Finished CREATE PROFILE tests\n");
  },
});

// ----------------------------------------------------------------------
// UPDATE PROFILE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "UserProfile concept: Unit tests for 'updateProfile' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=============================================");
    console.log("🧪 TEST GROUP: UPDATE PROFILE ACTIONS");
    console.log("=============================================\n");

    const [db, client] = await testDb();
    const userProfile = new TestableUserProfile(db);
    const coll: Collection<ProfileDoc> = db.collection("userprofiles");
    await coll.deleteMany({}); // Reset DB

    // Setup initial profile for updates
    await userProfile.createProfile({
      user: user1,
      firstName: "Initial",
      lastName: "Name",
      bio: "Initial Bio",
      thumbnail: "initial.png",
    });

    await t.step("✅ Happy path: Update only firstName", async () => {
      await userProfile.updateProfile({ user: user1, firstName: "Updated" });
      const profile = await userProfile.getProfile({ user: user1 });
      assertEquals(profile.firstName, "Updated");
      assertEquals(profile.lastName, "Name"); // Unchanged
      assertEquals(profile.bio, "Initial Bio"); // Unchanged
      assertEquals(profile.thumbnail, "initial.png"); // Unchanged
    });

    await t.step("✅ Happy path: Update bio and thumbnail", async () => {
      await userProfile.updateProfile({
        user: user1,
        bio: "New Bio",
        thumbnail: "new.jpg",
      });
      const profile = await userProfile.getProfile({ user: user1 });
      assertEquals(profile.firstName, "Updated"); // Unchanged from previous step
      assertEquals(profile.lastName, "Name"); // Unchanged
      assertEquals(profile.bio, "New Bio");
      assertEquals(profile.thumbnail, "new.jpg");
    });

    await t.step("✅ Edge case: Clear bio by setting it to null", async () => {
      await userProfile.updateProfile({ user: user1, bio: null });
      const profile = await userProfile.getProfile({ user: user1 });
      assertEquals(profile.bio, null);
    });

    await t.step("✅ Edge case: Update with empty string values", async () => {
      await userProfile.updateProfile({
        user: user1,
        firstName: "",
        lastName: "",
        thumbnail: "",
      });
      const profile = await userProfile.getProfile({ user: user1 });
      assertEquals(profile.firstName, "");
      assertEquals(profile.lastName, "");
      assertEquals(profile.bio, null); // Still null from previous step
      assertEquals(profile.thumbnail, "");
    });

    await t.step(
      "✅ Idempotency: Update a field to its current value",
      async () => {
        const initialProfile = await userProfile.getProfile({ user: user1 });
        await userProfile.updateProfile({
          user: user1,
          firstName: initialProfile.firstName,
        });
        const updatedProfile = await userProfile.getProfile({ user: user1 });
        assertEquals(updatedProfile, initialProfile); // No change
      },
    );

    await t.step(
      "✅ Requires violation: Cannot update a non-existent profile",
      async () => {
        await assertRejects(
          () =>
            userProfile.updateProfile({
              user: nonExistentUser,
              firstName: "Nope",
            }),
          Error,
          `UserProfile for user ${nonExistentUser} does not exist.`,
        );
      },
    );

    await t.step(
      "✅ Edge case: Update profile with empty string ID",
      async () => {
        await userProfile.createProfile({
          user: emptyID,
          firstName: "Empty",
          lastName: "ID",
        });
        await userProfile.updateProfile({
          user: emptyID,
          firstName: "Updated Empty",
        });
        const profile = await userProfile.getProfile({ user: emptyID });
        assertEquals(profile.firstName, "Updated Empty");
      },
    );

    await client.close();
    console.log("✅ Finished UPDATE PROFILE tests\n");
  },
});

// ----------------------------------------------------------------------
// DELETE PROFILE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "UserProfile concept: Unit tests for 'deleteProfile' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: DELETE PROFILE ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const userProfile = new TestableUserProfile(db);
    const coll: Collection<ProfileDoc> = db.collection("userprofiles");
    await coll.deleteMany({}); // Reset DB

    // Setup initial profile for deletion
    await userProfile.createProfile({
      user: user1,
      firstName: "To",
      lastName: "Delete",
    });

    await t.step("✅ Happy path: Delete an existing profile", async () => {
      await userProfile.deleteProfile({ user: user1 });

      // Verify it's gone
      await assertRejects(
        () => userProfile.getProfile({ user: user1 }),
        Error,
        `UserProfile for user ${user1} does not exist.`,
      );
      const dbEntry = await coll.findOne({ _id: user1 });
      assertEquals(dbEntry, null);
    });

    await t.step(
      "✅ Requires violation: Cannot delete a non-existent profile",
      async () => {
        await assertRejects(
          () => userProfile.deleteProfile({ user: nonExistentUser }),
          Error,
          `UserProfile for user ${nonExistentUser} does not exist.`,
        );
      },
    );

    await t.step(
      "✅ Idempotency: Attempt to delete an already deleted profile",
      async () => {
        // user1 was deleted in a previous step
        await assertRejects(
          () => userProfile.deleteProfile({ user: user1 }),
          Error,
          `UserProfile for user ${user1} does not exist.`,
        );
      },
    );

    await t.step(
      "✅ Edge case: Delete profile with empty string ID",
      async () => {
        await userProfile.createProfile({
          user: emptyID,
          firstName: "Empty",
          lastName: "ID",
        });
        await userProfile.deleteProfile({ user: emptyID });
        await assertRejects(
          () => userProfile.getProfile({ user: emptyID }),
          Error,
          `UserProfile for user ${emptyID} does not exist.`,
        );
      },
    );

    await client.close();
    console.log("✅ Finished DELETE PROFILE tests\n");
  },
});

// ----------------------------------------------------------------------
// GET PROFILE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "UserProfile concept: Unit tests for 'getProfile' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: GET PROFILE ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const userProfile = new TestableUserProfile(db);
    await db.collection("userprofiles").deleteMany({}); // Reset DB

    await t.step("✅ Happy path: Retrieve a full profile", async () => {
      await userProfile.createProfile({
        user: user1,
        firstName: "Test",
        lastName: "User",
        bio: "This is a test bio.",
        thumbnail: "test.jpg",
      });

      const profile = await userProfile.getProfile({ user: user1 });
      assertEquals(profile._id, user1);
      assertEquals(profile.firstName, "Test");
      assertEquals(profile.lastName, "User");
      assertEquals(profile.bio, "This is a test bio.");
      assertEquals(profile.thumbnail, "test.jpg");
    });

    await t.step(
      "✅ Happy path: Retrieve a profile with null optional fields",
      async () => {
        await userProfile.createProfile({
          user: user2,
          firstName: "Null",
          lastName: "Fields",
        }); // bio and thumbnail will be null by default

        const profile = await userProfile.getProfile({ user: user2 });
        assertEquals(profile._id, user2);
        assertEquals(profile.firstName, "Null");
        assertEquals(profile.lastName, "Fields");
        assertEquals(profile.bio, null);
        assertEquals(profile.thumbnail, null);
      },
    );

    await t.step(
      "✅ Requires violation: Cannot retrieve a non-existent profile",
      async () => {
        await assertRejects(
          () => userProfile.getProfile({ user: nonExistentUser }),
          Error,
          `UserProfile for user ${nonExistentUser} does not exist.`,
        );
      },
    );

    await t.step(
      "✅ Edge case: Retrieve profile with empty string ID",
      async () => {
        await userProfile.createProfile({
          user: emptyID,
          firstName: "Empty",
          lastName: "ID",
        });
        const profile = await userProfile.getProfile({ user: emptyID });
        assertEquals(profile._id, emptyID);
        assertEquals(profile.firstName, "Empty");
      },
    );

    await t.step(
      "✅ Edge case: Retrieve profile with empty string values",
      async () => {
        await userProfile.createProfile({
          user: user3,
          firstName: "",
          lastName: "",
          bio: "",
          thumbnail: "",
        });
        const profile = await userProfile.getProfile({ user: user3 });
        assertEquals(profile.firstName, "");
        assertEquals(profile.lastName, "");
        assertEquals(profile.bio, "");
        assertEquals(profile.thumbnail, "");
      },
    );

    await client.close();
    console.log("✅ Finished GET PROFILE tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST (Principle Verification)
// ----------------------------------------------------------------------
Deno.test({
  name: "UserProfile concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const userProfile = new TestableUserProfile(db);
    await db.collection("userprofiles").deleteMany({}); // Reset DB

    const testUser = user1;

    // 1. Initially, no profile should exist for testUser
    await assertRejects(
      () => userProfile.getProfile({ user: testUser }),
      Error,
      `UserProfile for user ${testUser} does not exist.`,
    );

    // 2. Create a profile for testUser
    await userProfile.createProfile({
      user: testUser,
      firstName: "Alice",
      lastName: "Wonder",
      bio: "An aspiring adventurer.",
      thumbnail: "alice_initial.png",
    });

    let profile = await userProfile.getProfile({ user: testUser });
    assertEquals(profile.firstName, "Alice");
    assertEquals(profile.lastName, "Wonder");
    assertEquals(profile.bio, "An aspiring adventurer.");
    assertEquals(profile.thumbnail, "alice_initial.png");

    // 3. Update only the bio
    await userProfile.updateProfile({
      user: testUser,
      bio: "A seasoned explorer now.",
    });
    profile = await userProfile.getProfile({ user: testUser });
    assertEquals(profile.firstName, "Alice"); // Unchanged
    assertEquals(profile.lastName, "Wonder"); // Unchanged
    assertEquals(profile.bio, "A seasoned explorer now.");
    assertEquals(profile.thumbnail, "alice_initial.png"); // Unchanged

    // 4. Update thumbnail and clear bio
    await userProfile.updateProfile({
      user: testUser,
      thumbnail: "alice_final.png",
      bio: null,
    });
    profile = await userProfile.getProfile({ user: testUser });
    assertEquals(profile.firstName, "Alice"); // Unchanged
    assertEquals(profile.lastName, "Wonder"); // Unchanged
    assertEquals(profile.bio, null); // Cleared
    assertEquals(profile.thumbnail, "alice_final.png"); // Updated

    // 5. Update first name, last name, and re-add bio
    await userProfile.updateProfile({
      user: testUser,
      firstName: "Alicia",
      lastName: "W. Smith",
      bio: "Retired from adventures, enjoying quiet life.",
    });
    profile = await userProfile.getProfile({ user: testUser });
    assertEquals(profile.firstName, "Alicia");
    assertEquals(profile.lastName, "W. Smith");
    assertEquals(profile.bio, "Retired from adventures, enjoying quiet life.");
    assertEquals(profile.thumbnail, "alice_final.png"); // Unchanged

    // 6. Delete the profile
    await userProfile.deleteProfile({ user: testUser });

    // 7. Verify the profile is deleted
    await assertRejects(
      () => userProfile.getProfile({ user: testUser }),
      Error,
      `UserProfile for user ${testUser} does not exist.`,
    );

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS (Concurrency-like scenarios, cleanup, data consistency)
// ----------------------------------------------------------------------
Deno.test({
  name: "UserProfile concept: Robustness and concurrency tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const userProfile = new TestableUserProfile(db);
    const coll: Collection<ProfileDoc> = db.collection("userprofiles");
    await coll.deleteMany({}); // Reset DB

    // Scenario 1: Concurrent creation attempts (only one should succeed)
    console.log("  - Concurrent createProfile attempts for same user:");
    const createPromises = [
      userProfile.createProfile({ user: user1, firstName: "A", lastName: "B" }),
      userProfile.createProfile({ user: user1, firstName: "C", lastName: "D" }),
      userProfile.createProfile({ user: user1, firstName: "E", lastName: "F" }),
    ];

    const createResults = await Promise.allSettled(createPromises);
    const fulfilledCreates = createResults.filter((r) =>
      r.status === "fulfilled"
    ).length;
    const rejectedCreates =
      createResults.filter((r) => r.status === "rejected").length;

    assertEquals(fulfilledCreates, 1, "Only one createProfile should succeed.");
    assertEquals(
      rejectedCreates,
      createResults.length - 1,
      "Remaining creates should be rejected.",
    );

    await userProfile.getProfile({ user: user1 });
    // The exact first/last name might vary depending on which promise resolves first,
    // but there should only be one profile.
    assertEquals(
      await coll.countDocuments({ _id: user1 }),
      1,
      "Only one profile should exist for user1.",
    );
    console.log("    => Verified single profile creation.");

    // Scenario 2: Concurrent updates to different fields of the same profile
    console.log(
      "  - Concurrent updateProfile attempts for same user with different fields:",
    );
    await coll.deleteMany({}); // Reset DB for next scenario
    await userProfile.createProfile({
      user: user2,
      firstName: "Orig",
      lastName: "Name",
      bio: "Old bio",
      thumbnail: "old.png",
    });

    const updatePromises = [
      userProfile.updateProfile({ user: user2, firstName: "UpdatedFirst" }),
      userProfile.updateProfile({ user: user2, lastName: "UpdatedLast" }),
      userProfile.updateProfile({ user: user2, bio: "New Bio Content" }),
      userProfile.updateProfile({ user: user2, thumbnail: "new.url" }),
    ];

    const updateResults = await Promise.all(updatePromises); // All should fulfill
    assertEquals(
      updateResults.length,
      4,
      "All concurrent updates should fulfill.",
    );

    const finalProfile = await userProfile.getProfile({ user: user2 });
    assertEquals(finalProfile.firstName, "UpdatedFirst");
    assertEquals(finalProfile.lastName, "UpdatedLast");
    assertEquals(finalProfile.bio, "New Bio Content");
    assertEquals(finalProfile.thumbnail, "new.url");
    console.log("    => Verified all concurrent updates applied correctly.");

    // Scenario 3: Delete profile, then immediately try to get it
    console.log("  - Delete and immediate retrieve attempt:");
    await coll.deleteMany({}); // Reset DB for next scenario
    await userProfile.createProfile({
      user: user3,
      firstName: "Temp",
      lastName: "User",
    });

    await userProfile.deleteProfile({ user: user3 });
    await assertRejects(
      () => userProfile.getProfile({ user: user3 }),
      Error,
      `UserProfile for user ${user3} does not exist.`,
      "Profile should be immediately non-existent after deletion.",
    );
    console.log("    => Verified immediate deletion and non-existence.");

    await client.close();
    console.log("✅ Finished ROBUSTNESS tests\n");
  },
});

// ----------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------
Deno.test({
  name: "✅ Final summary",
  fn() {
    console.log(
      "\n======================================================================",
    );
    console.log(
      "🎉 USERPROFILE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉",
    );
    console.log(
      "========================================================================\n",
    );
  },
});

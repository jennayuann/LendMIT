# Task: Use the following test guide and implementation of a concept to implement a comprehensive yet concise Deno test file for the given concept implementation.

# Requirements:
- The test file should be named src/concepts/{ConceptName}.test.ts (for example, src/concepts/Following.test.ts).
- Use the Deno testing framework and import:
  import { assertEquals, assertRejects } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
- Each test should:
  1. Initialize a clean database using: const [db, client] = await testDb();
  2. Create a new instance of the concept class using that db.
  3. Close the client with await client.close(); at the end of each test.

# What to Include:
1. Unit tests for every action.
   - Happy-path tests: confirm that actions work correctly when all requires are met.
   - Requires violation tests: confirm that appropriate errors are thrown when preconditions are not met.
   - Edge case tests: explore boundaries of valid inputs (e.g., empty strings, same IDs, missing optional fields, invalid JSON, etc.).
   - Idempotency checks: ensure repeated valid actions behave consistently.
   - State verification: confirm the MongoDB collection reflects correct changes after each operation.

2. Trace test (Principle verification).
   - Write one “trace” test that simulates a realistic multi-step interaction showing how the actions collectively fulfill the concept’s principle.

3. Robustness tests.
   - Add cases for edge cases, unexpected sequences, or concurrency-like scenarios.
   - Validate cleanup and data consistency after failed operations.

# Output:
- Produce one complete .ts test file for the concept (e.g., src/concepts/concept.test.ts).

# Example structure:
```
// src/concepts/Following/Following.test.ts

  

// deno-lint-ignore no-import-prefix

import { assertEquals, assertRejects } from "jsr:@std/assert";

import { testDb } from "@utils/database.ts";

import { Following } from "./Following.ts";

import { Collection } from "mongodb";

import { ID } from "@utils/types.ts";

  

// ----------------------------------------------------------------------

// Global Test Constants

// ----------------------------------------------------------------------

const userA = "userA" as ID;

const userB = "userB" as ID;

const userC = "userC" as ID;

const userD = "userD" as ID;

const nonExistentUser = "nonExistentUser" as ID;

  

console.log("\n===========================================");

console.log(" ⏰ STARTING TESTS FOR FOLLOWING CONCEPT");

console.log("===========================================\n");

  

// ----------------------------------------------------------------------

// FOLLOW ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'follow' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===========================================");

console.log("🧪 TEST GROUP: FOLLOW ACTIONS");

console.log("===========================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

const coll: Collection = db.collection("followrelationships");

await coll.deleteMany({}); // reset DB

  

await t.step("✅ Happy path: A user follows another user", async () => {

await following.follow(userA, userB);

  

const { isFollowing } = await following.isFollowing(userA, userB);

assertEquals(isFollowing, true);

  

const { followeeIDs } = await following.getFollowees(userA);

assertEquals(followeeIDs.includes(userB), true);

  

const { followerIDs } = await following.getFollowers(userB);

assertEquals(followerIDs.includes(userA), true);

  

const dbEntry = await coll.findOne({ follower: userA, followee: userB });

assertEquals(dbEntry?.follower, userA);

assertEquals(dbEntry?.followee, userB);

});

  

await t.step("✅ Requires violation: Cannot follow yourself", async () => {

await assertRejects(() => following.follow(userA, userA), Error, "Cannot follow yourself.");

});

  

await t.step("✅ Requires violation: Cannot follow someone already followed", async () => {

await following.follow(userA, userC);

await assertRejects(

() => following.follow(userA, userC),

Error,

`Follower '${userA}' is already following followee '${userC}'.`,

);

  

const count = await coll.countDocuments({ follower: userA, followee: userC });

assertEquals(count, 1);

});

  

await t.step("✅ Edge case: Following with empty string IDs", async () => {

const emptyID = "" as ID;

await following.follow(emptyID, userD);

const { isFollowing } = await following.isFollowing(emptyID, userD);

assertEquals(isFollowing, true);

  

await following.follow(userD, emptyID);

const { isFollowing: isFollowingEmptyFollowee } = await following.isFollowing(userD, emptyID);

assertEquals(isFollowingEmptyFollowee, true);

});

  

await client.close();

console.log("✅ Finished FOLLOW tests\n");

},

});

  

// ----------------------------------------------------------------------

// UNFOLLOW ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'unfollow' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n=============================================");

console.log("🧪 TEST GROUP: UNFOLLOW ACTIONS");

console.log("=============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

const coll: Collection = db.collection("followrelationships");

await coll.deleteMany({}); // reset DB

  

await t.step("✅ Happy path: A user unfollows another user", async () => {

await following.follow(userA, userB);

await following.unfollow(userA, userB);

  

const { isFollowing } = await following.isFollowing(userA, userB);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Requires violation: Cannot unfollow someone not followed", async () => {

await assertRejects(

() => following.unfollow(userA, userC),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${userC}'.`,

);

});

  

await t.step("✅ Edge case: Unfollowing non-existent relationships (idempotency)", async () => {

await assertRejects(

() => following.unfollow(userA, userB),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${userB}'.`,

);

});

  

await t.step("✅ Robustness: Unfollowing with non-existent IDs", async () => {

await assertRejects(

() => following.unfollow(nonExistentUser, userA),

Error,

`No existing follow relationship found between follower '${nonExistentUser}' and followee '${userA}'.`,

);

  

await assertRejects(

() => following.unfollow(userA, nonExistentUser),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${nonExistentUser}'.`,

);

});

  

await client.close();

console.log("✅ Finished UNFOLLOW tests\n");

},

});

  

// ----------------------------------------------------------------------

// IS FOLLOWING ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'isFollowing' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: IS FOLLOWING CHECKS");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

await t.step("✅ Happy path", async () => {

await following.follow(userA, userB);

const { isFollowing } = await following.isFollowing(userA, userB);

assertEquals(isFollowing, true);

});

  

await t.step("✅ Negative path: Non-existent relationship", async () => {

const { isFollowing } = await following.isFollowing(userA, userC);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Edge case: False after unfollowing", async () => {

await following.follow(userA, userD);

await following.unfollow(userA, userD);

const { isFollowing } = await following.isFollowing(userA, userD);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Edge case: Self-follow should be false", async () => {

const { isFollowing } = await following.isFollowing(userA, userA);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Edge case: Non-existent users", async () => {

const { isFollowing: nonExistFollower } = await following.isFollowing(nonExistentUser, userB);

assertEquals(nonExistFollower, false);

  

const { isFollowing: nonExistFollowee } = await following.isFollowing(userA, nonExistentUser);

assertEquals(nonExistFollowee, false);

});

  

await client.close();

console.log("✅ Finished ISFOLLOWING tests\n");

},

});

  

// ----------------------------------------------------------------------

// GET FOLLOWEES ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'getFollowees' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: GET FOLLOWEES ACTIONS");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

await t.step("✅ Happy path: Multiple followees", async () => {

await following.follow(userA, userB);

await following.follow(userA, userC);

  

const { followeeIDs } = await following.getFollowees(userA);

assertEquals(followeeIDs.sort(), [userB, userC].sort());

});

  

await t.step("✅ Edge case: User with no followees", async () => {

const { followeeIDs } = await following.getFollowees(userD);

assertEquals(followeeIDs, []);

});

  

await t.step("✅ Edge case: Non-existent user", async () => {

const { followeeIDs } = await following.getFollowees(nonExistentUser);

assertEquals(followeeIDs, []);

});

  

await t.step("✅ State update after unfollowing", async () => {

await following.follow(userB, userA);

await following.follow(userB, userC);

await following.unfollow(userB, userA);

  

const { followeeIDs } = await following.getFollowees(userB);

assertEquals(followeeIDs, [userC]);

});

  

await client.close();

console.log("✅ Finished GETFOLLOWEES tests\n");

},

});

  

// ----------------------------------------------------------------------

// GET FOLLOWERS ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'getFollowers' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: GET FOLLOWERS ACTIONS");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

await t.step("✅ Happy path: Multiple followers", async () => {

await following.follow(userA, userC);

await following.follow(userB, userC);

  

const { followerIDs } = await following.getFollowers(userC);

assertEquals(followerIDs.sort(), [userA, userB].sort());

});

  

await t.step("✅ Edge case: User with no followers", async () => {

const { followerIDs } = await following.getFollowers(userD);

assertEquals(followerIDs, []);

});

  

await t.step("✅ Edge case: Non-existent user", async () => {

const { followerIDs } = await following.getFollowers(nonExistentUser);

assertEquals(followerIDs, []);

});

  

await t.step("✅ State update after unfollowing", async () => {

await following.follow(userA, userD);

await following.follow(userB, userD);

await following.unfollow(userA, userD);

  

const { followerIDs } = await following.getFollowers(userD);

assertEquals(followerIDs, [userB]);

});

  

await client.close();

console.log("✅ Finished GETFOLLOWERS tests\n");

},

});

  

// ----------------------------------------------------------------------

// TRACE / FULL BEHAVIOR TEST

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Trace scenario (end-to-end behavior)",

sanitizeOps: false,

sanitizeResources: false,

async fn() {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

assertEquals((await following.getFollowees(userA)).followeeIDs, []);

assertEquals((await following.getFollowers(userB)).followerIDs, []);

  

await following.follow(userA, userB);

await following.follow(userA, userC);

await following.follow(userD, userB);

  

assertEquals((await following.getFollowees(userA)).followeeIDs.sort(), [userB, userC].sort());

assertEquals((await following.getFollowers(userB)).followerIDs.sort(), [userA, userD].sort());

  

await following.unfollow(userA, userB);

await following.unfollow(userD, userB);

  

assertEquals((await following.getFollowers(userB)).followerIDs, []);

assertEquals((await following.getFollowees(userA)).followeeIDs, [userC]);

  

await client.close();

console.log("✅ Finished TRACE demonstration\n");

},

});

  

// ----------------------------------------------------------------------

// ROBUSTNESS / CONCURRENCY TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Robustness and concurrency tests",

sanitizeOps: false,

sanitizeResources: false,

async fn() {

console.log("\n=================================================");

console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");

console.log("=================================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

const coll: Collection = db.collection("followrelationships");

await coll.deleteMany({}); // reset DB

  

const results = await Promise.allSettled([

following.follow(userA, userB),

following.follow(userA, userB),

]);

const fulfilledCount = results.filter(r => r.status === "fulfilled").length;

const rejectedCount = results.filter(r => r.status === "rejected").length;

assertEquals(fulfilledCount, 1);

assertEquals(rejectedCount, 1);

  

const count = await coll.countDocuments({ follower: userA, followee: userB });

assertEquals(count, 1);

  

await coll.deleteMany({}); // reset db before next scenario

  

await following.follow(userA, userC);

await following.follow(userB, userD);

await following.follow(userC, userA);

  

await assertRejects(

() => following.follow(userA, userC),

Error,

`Follower '${userA}' is already following followee '${userC}'.`,

);

await assertRejects(

() => following.unfollow(userA, userD),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${userD}'.`,

);

  

assertEquals((await following.getFollowees(userA)).followeeIDs, [userC]);

assertEquals((await following.getFollowers(userD)).followerIDs, [userB]);

assertEquals((await following.getFollowees(userB)).followeeIDs, [userD]);

  

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

console.log("\n====================================================================");

console.log("🎉 FOLLOWING CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");

console.log("======================================================================\n");

},

});
```

## Guide for testing concepts:
[@testing-concepts](../../../background/testing-concepts.md)

## Concept to write tests for:
[@UserProfile](../UserProfile.md)
## Implementation of concept to write tests for:
```
// src/concepts/UserProfile.ts

  

// Deno does not require extension for @/ imports but the linter might complain if not configured.

// For npm:mongodb, ensure it's "npm:mongodb" as per Deno's npm specifier.

import { Collection } from "mongodb";

import { db } from "@/db/connection.ts"; // Import the connected db instance

import { ID, Empty } from "@/utils/types.ts";

  

/**

* @type User

* The 'User' in the concept specification is the unique identifier for an entity,

* which is mapped to the `ID` type from our utilities.

*/

type User = ID;

  

/**

* @interface Profile

* Represents a user's profile with descriptive attributes.

* The `_id` field serves as the primary key for the profile, directly corresponding to the `user` identifier.

* `bio` and `thumbnail` can be `null` if explicitly cleared or not set.

*/

interface Profile {

_id: User; // The user ID serves as the primary key for the profile

firstName: string | null;

lastName: string | null;

bio: string | null;

thumbnail: string | null; // URL or identifier for an image

}

  

/**

* @concept UserProfile

* @purpose Manage mutable, descriptive attributes associated with an entity.

* @principle If a profile is created for an entity identifier, its associated attributes

* (such as first name, last name, bio, and thumbnail image) can be independently

* updated, retrieved, or removed, providing flexible management of descriptive information.

*/

class UserProfile {

private userProfiles: Collection<Profile>;

// The MongoDB collection name should be the plural form of the concept.

private readonly collectionName = "userprofiles";

  

constructor() {

this.userProfiles = db.collection<Profile>(this.collectionName);

}

  

/**

* @action createProfile

* Creates a new `Profile` entry for the given `user` with the provided attributes.

* If `bio` or `thumbnail` are not explicitly provided, they are initialized as `null`.

*

* @param {Object} args - The arguments for creating a profile.

* @param {User} args.user - The unique identifier for the user.

* @param {string} args.firstName - The user's first name.

* @param {string} args.lastName - The user's last name.

* @param {string | null} [args.bio=null] - An optional biography for the user. Defaults to `null`.

* @param {string | null} [args.thumbnail=null] - An optional URL or identifier for the user's thumbnail image. Defaults to `null`.

* @returns {Promise<Empty>} An empty object upon successful creation.

*

* @requires No `Profile` entry for `args.user` currently exists.

* @effects Creates a new `Profile` entry for the given `user` with the provided attributes.

* @throws {Error} If a profile for the user already exists.

*/

async createProfile(args: {

user: User;

firstName: string;

lastName: string;

bio?: string | null;

thumbnail?: string | null;

}): Promise<Empty> {

const { user, firstName, lastName, bio = null, thumbnail = null } = args;

  

// Requires: No Profile entry for user currently exists.

const existingProfile = await this.userProfiles.findOne({ _id: user });

if (existingProfile) {

throw new Error(`UserProfile for user ${user} already exists.`);

}

  

// Effects: Creates a new Profile entry for the given user.

const newProfile: Profile = {

_id: user,

firstName,

lastName,

bio,

thumbnail,

};

await this.userProfiles.insertOne(newProfile);

return {};

}

  

/**

* @action updateProfile

* Updates existing attributes of a user's profile.

* Only provided non-`undefined` arguments will overwrite existing values.

* An argument provided as `null` will explicitly clear that attribute.

* Arguments that are not provided at all (`undefined`) will leave the corresponding attribute unchanged.

*

* @param {Object} args - The arguments for updating a profile.

* @param {User} args.user - The unique identifier for the user whose profile is to be updated.

* @param {string | null | undefined} [args.firstName] - The new first name, or `null` to clear.

* @param {string | null | undefined} [args.lastName] - The new last name, or `null` to clear.

* @param {string | null | undefined} [args.bio] - The new biography, or `null` to clear.

* @param {string | null | undefined} [args.thumbnail] - The new thumbnail URL/identifier, or `null` to clear.

* @returns {Promise<Empty>} An empty object upon successful update.

*

* @requires A `Profile` entry for `args.user` exists.

* @effects Updates the `firstName`, `lastName`, `bio`, and `thumbnail` for the given `user`.

* @throws {Error} If no profile for the user exists.

*/

async updateProfile(args: {

user: User;

firstName?: string | null;

lastName?: string | null;

bio?: string | null;

thumbnail?: string | null;

}): Promise<Empty> {

const { user, firstName, lastName, bio, thumbnail } = args;

  

// Requires: A Profile entry for user exists.

const existingProfile = await this.userProfiles.findOne({ _id: user });

if (!existingProfile) {

throw new Error(`UserProfile for user ${user} does not exist.`);

}

  

// Effects: Updates the profile attributes.

const updateDoc: { $set: Partial<Omit<Profile, "_id">> } = { $set: {} };

  

// Conditionally add fields to $set based on whether they were explicitly provided (not undefined)

if (firstName !== undefined) {

updateDoc.$set.firstName = firstName;

}

if (lastName !== undefined) {

updateDoc.$set.lastName = lastName;

}

if (bio !== undefined) {

updateDoc.$set.bio = bio;

}

if (thumbnail !== undefined) {

updateDoc.$set.thumbnail = thumbnail;

}

  

// If no fields are provided for update (all arguments were undefined), do nothing.

if (Object.keys(updateDoc.$set).length === 0) {

return {};

}

  

const result = await this.userProfiles.updateOne({ _id: user }, updateDoc);

  

// This check provides additional robustness, although the 'requires' condition

// should ideally prevent `matchedCount === 0`.

if (result.matchedCount === 0) {

throw new Error(

`UserProfile for user ${user} not found during update, despite initial existence check.`,

);

}

  

return {};

}

  

/**

* @action deleteProfile

* Deletes the `Profile` entry associated with the `user`.

*

* @param {Object} args - The arguments for deleting a profile.

* @param {User} args.user - The unique identifier for the user whose profile is to be deleted.

* @returns {Promise<Empty>} An empty object upon successful deletion.

*

* @requires A `Profile` entry for `args.user` exists.

* @effects Deletes the `Profile` entry associated with the `user`.

* @throws {Error} If no profile for the user exists.

*/

async deleteProfile(args: { user: User }): Promise<Empty> {

const { user } = args;

  

// Requires: A Profile entry for user exists.

const existingProfile = await this.userProfiles.findOne({ _id: user });

if (!existingProfile) {

throw new Error(`UserProfile for user ${user} does not exist.`);

}

  

// Effects: Deletes the Profile entry.

const result = await this.userProfiles.deleteOne({ _id: user });

if (result.deletedCount === 0) {

// This should ideally not happen due to the initial findOne check.

throw new Error(

`Failed to delete UserProfile for user ${user}, despite initial existence check.`,

);

}

return {};

}

  

/**

* @action getProfile

* Returns the `Profile` object containing the `firstName`, `lastName`, `bio`, and `thumbnail`

* associated with the `user`.

*

* @param {Object} args - The arguments for getting a profile.

* @param {User} args.user - The unique identifier for the user.

* @returns {Promise<Profile>} The user's profile object.

*

* @requires A `Profile` entry for `args.user` exists.

* @effects Returns the Profile.

* @throws {Error} If no profile for the user exists.

*/

async getProfile(args: { user: User }): Promise<Profile> {

const { user } = args;

  

// Requires: A Profile entry for user exists.

const profile = await this.userProfiles.findOne({ _id: user });

if (!profile) {

throw new Error(`UserProfile for user ${user} does not exist.`);

}

  

// Effects: Returns the Profile.

// The '_id' field of the MongoDB document directly maps to the 'User' type in our Profile interface,

// satisfying the concept's requirement for returning the 'user' identifier within the profile.

return profile;

}

}

  

// Export the instantiated class following the implementation requirements.

export const userProfile = new UserProfile();
```
# response:

```typescript
// src/concepts/UserProfile.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { UserProfile } from "./UserProfile.ts"; // Import the class, not the instance
import { Collection, Db } from "mongodb"; // Import Db type for constructor
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

    await t.step("✅ Happy path: Create a profile with all fields", async () => {
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
    });

    await t.step("✅ Happy path: Create a profile with only required fields", async () => {
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
    });

    await t.step("✅ Requires violation: Cannot create profile for an existing user", async () => {
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
    });

    await t.step("✅ Edge case: Create profile with empty string ID", async () => {
      await userProfile.createProfile({
        user: emptyID,
        firstName: "Empty",
        lastName: "ID",
      });

      const profile = await userProfile.getProfile({ user: emptyID });
      assertEquals(profile._id, emptyID);
      assertEquals(profile.firstName, "Empty");
      assertEquals(profile.lastName, "ID");
    });

    await t.step("✅ Edge case: Create profile with empty string for names/bio/thumbnail", async () => {
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
    });

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

    await t.step("✅ Idempotency: Update a field to its current value", async () => {
      const initialProfile = await userProfile.getProfile({ user: user1 });
      await userProfile.updateProfile({ user: user1, firstName: initialProfile.firstName });
      const updatedProfile = await userProfile.getProfile({ user: user1 });
      assertEquals(updatedProfile, initialProfile); // No change
    });

    await t.step("✅ Requires violation: Cannot update a non-existent profile", async () => {
      await assertRejects(
        () => userProfile.updateProfile({ user: nonExistentUser, firstName: "Nope" }),
        Error,
        `UserProfile for user ${nonExistentUser} does not exist.`,
      );
    });

    await t.step("✅ Edge case: Update profile with empty string ID", async () => {
      await userProfile.createProfile({
        user: emptyID,
        firstName: "Empty",
        lastName: "ID",
      });
      await userProfile.updateProfile({ user: emptyID, firstName: "Updated Empty" });
      const profile = await userProfile.getProfile({ user: emptyID });
      assertEquals(profile.firstName, "Updated Empty");
    });

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

    await t.step("✅ Requires violation: Cannot delete a non-existent profile", async () => {
      await assertRejects(
        () => userProfile.deleteProfile({ user: nonExistentUser }),
        Error,
        `UserProfile for user ${nonExistentUser} does not exist.`,
      );
    });

    await t.step("✅ Idempotency: Attempt to delete an already deleted profile", async () => {
      // user1 was deleted in a previous step
      await assertRejects(
        () => userProfile.deleteProfile({ user: user1 }),
        Error,
        `UserProfile for user ${user1} does not exist.`,
      );
    });

    await t.step("✅ Edge case: Delete profile with empty string ID", async () => {
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
    });

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

    await t.step("✅ Happy path: Retrieve a profile with null optional fields", async () => {
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
    });

    await t.step("✅ Requires violation: Cannot retrieve a non-existent profile", async () => {
      await assertRejects(
        () => userProfile.getProfile({ user: nonExistentUser }),
        Error,
        `UserProfile for user ${nonExistentUser} does not exist.`,
      );
    });

    await t.step("✅ Edge case: Retrieve profile with empty string ID", async () => {
      await userProfile.createProfile({
        user: emptyID,
        firstName: "Empty",
        lastName: "ID",
      });
      const profile = await userProfile.getProfile({ user: emptyID });
      assertEquals(profile._id, emptyID);
      assertEquals(profile.firstName, "Empty");
    });

    await t.step("✅ Edge case: Retrieve profile with empty string values", async () => {
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
    });

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
    await userProfile.updateProfile({ user: testUser, bio: "A seasoned explorer now." });
    profile = await userProfile.getProfile({ user: testUser });
    assertEquals(profile.firstName, "Alice"); // Unchanged
    assertEquals(profile.lastName, "Wonder"); // Unchanged
    assertEquals(profile.bio, "A seasoned explorer now.");
    assertEquals(profile.thumbnail, "alice_initial.png"); // Unchanged

    // 4. Update thumbnail and clear bio
    await userProfile.updateProfile({ user: testUser, thumbnail: "alice_final.png", bio: null });
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
    const fulfilledCreates = createResults.filter((r) => r.status === "fulfilled").length;
    const rejectedCreates = createResults.filter((r) => r.status === "rejected").length;

    assertEquals(fulfilledCreates, 1, "Only one createProfile should succeed.");
    assertEquals(
      rejectedCreates,
      createResults.length - 1,
      "Remaining creates should be rejected.",
    );

    const profileAfterConcurrentCreate = await userProfile.getProfile({ user: user1 });
    // The exact first/last name might vary depending on which promise resolves first,
    // but there should only be one profile.
    assertEquals(
      await coll.countDocuments({ _id: user1 }),
      1,
      "Only one profile should exist for user1.",
    );
    console.log("    => Verified single profile creation.");

    // Scenario 2: Concurrent updates to different fields of the same profile
    console.log("  - Concurrent updateProfile attempts for same user with different fields:");
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
    assertEquals(updateResults.length, 4, "All concurrent updates should fulfill.");

    const finalProfile = await userProfile.getProfile({ user: user2 });
    assertEquals(finalProfile.firstName, "UpdatedFirst");
    assertEquals(finalProfile.lastName, "UpdatedLast");
    assertEquals(finalProfile.bio, "New Bio Content");
    assertEquals(finalProfile.thumbnail, "new.url");
    console.log("    => Verified all concurrent updates applied correctly.");

    // Scenario 3: Delete profile, then immediately try to get it
    console.log("  - Delete and immediate retrieve attempt:");
    await coll.deleteMany({}); // Reset DB for next scenario
    await userProfile.createProfile({ user: user3, firstName: "Temp", lastName: "User" });

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
    console.log("🎉 USERPROFILE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
    console.log(
      "========================================================================\n",
    );
  },
});
```
---
timestamp: 'Sun Oct 19 2025 01:04:09 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010409.a122a9da.md]]'
content_id: 817982641797851d9e8626e84fedae7e2065fb7046eee20d072ec5faad06a543
---

# concept: UserAuthentication

* **concept**: UserAuthentication \[User]

* **purpose**: Manage user accounts, including creation, credential management, status, and the email verification process required for full account activation and login.

* **principle**: When a user registers with a unique email and password, their account is created but remains `UNVERIFIED`. The system sends a verification code to their email. If they correctly provide this code before it expires, their account `status` becomes `VERIFIED`. Only `VERIFIED` users can log in. A user may later change their password (if `VERIFIED`) or deactivate their account. If an account is `DEACTIVATED`, it cannot be used to log in until it is reactivated, returning to an `UNVERIFIED` state.

* **state**:

  * a set of `UserAccounts` with
    * `user` User
    * `email` String
    * `passwordHashed` String
    * `status` of VERIFIED or UNVERIFIED or DEACTIVATED (default `UNVERIFIED`)
  * a set of `VerificationCodes` with
    * `user` User (referencing the `user` ID from `UserAccounts`)
    * `code` String
    * `expiry` DateTime

* **actions**:

  * `registerUser (email: String, password: String): (user: User)`
    * **requires**: `email` is unique and not currently associated with any existing `UserAccount` entry.
    * **effects**: Creates a new `user` ID, associates it with `email`, a hashed version of `password`, and sets `status` to `UNVERIFIED`. Returns the newly created `user` ID.
  * `registerUser (email: String, password: String): (error: String)`
    * **requires**: `email` is already associated with an existing `UserAccount` entry.
    * **effects**: Returns an `error` message indicating the email is already in use.
  * `sendVerificationCode (user: User, email: String): Empty`
    * **requires**: A `UserAccount` exists for `user` with the given `email`, and `status` is `UNVERIFIED`. No unexpired `VerificationCodes` exists for `user`.
    * **effects**: Deletes any existing `VerificationCodes` for `user`. Creates a new `VerificationCodes` entry for `user` with a newly generated `code`, and an `expiry` time (e.g., 15 minutes from `currentTime`).
  * `verifyCode (user: User, code: String): (verified: Boolean)`
    * **requires**: An unexpired `VerificationCodes` exists for `user` with a matching `code`. The `UserAccount` for `user` exists and `status` is `UNVERIFIED`.
    * **effects**: If the `requires` condition is met, deletes the matching `VerificationCodes` entry, sets the `status` for the `UserAccount` of `user` to `VERIFIED`, and returns `true`. Otherwise, returns `false`.
  * `login (email: String, password: String): (user: User)`
    * **requires**: A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`, and `status` is `VERIFIED`.
    * **effects**: Returns the `user` ID associated with the matching credentials.
  * `login (email: String, password: String): (error: String)`
    * **requires**: No `UserAccount` entry exists with `email`, or `passwordHashed` does not match `password`, or `status` is `DEACTIVATED` or `UNVERIFIED`.
    * **effects**: Returns an `error` message indicating authentication failure.
  * `changePassword (user: User, newPassword: String): Empty`
    * **requires**: A `UserAccount` entry for `user` exists and `status` is `VERIFIED`.
    * **effects**: Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.
  * `activateUser (user: User): Empty`
    * **requires**: A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.
    * **effects**: Sets the `status` for `user` to `UNVERIFIED`.
  * `deactivateUser (user: User): Empty`
    * **requires**: A `UserAccount` entry for `user` exists and `status` is `VERIFIED` or `UNVERIFIED`.
    * **effects**: Sets the `status` for `user` to `DEACTIVATED`.
  * `revokeVerification (user: User): Empty`
    * **requires**: One or more `VerificationCodes` entries exist for `user`.
    * **effects**: Deletes all `VerificationCodes` entries associated with `user`.
  * `system cleanExpiredCodes (): Empty`
    * **requires**: There are `VerificationCodes` entries where `currentTime >= expiry`.
    * **effects**: Deletes all `VerificationCodes` entries that have expired.

***

## db/connection.ts:

```
// src/db/connection.ts

// deno-lint-ignore no-import-prefix

import { MongoClient } from "npm:mongodb";

// deno-lint-ignore no-import-prefix

import "jsr:@std/dotenv/load";

  

const MONGODB_URL = Deno.env.get("MONGODB_URL");

const DB_NAME = Deno.env.get("DB_NAME");

  

if (!MONGODB_URL || !DB_NAME) {

throw new Error("Missing MONGODB_URL or DB_NAME in environment variables");

}

  

const client = new MongoClient(MONGODB_URL);

  

// Connect once and export the database

await client.connect(); // ✅ Establish connection once

console.log(`✅ Connected to MongoDB database: ${DB_NAME}`);

  

export const db = client.db(DB_NAME);
```

## utils/database.ts:

```
// This import loads the `.env` file as environment variables

// deno-lint-ignore no-import-prefix

import "jsr:@std/dotenv/load";

// deno-lint-ignore no-import-prefix

import { Db, MongoClient } from "npm:mongodb";

import { ID } from "@utils/types.ts";

// deno-lint-ignore no-import-prefix

import { generate } from "jsr:@std/uuid/unstable-v7";

  

async function initMongoClient() {

const DB_CONN = Deno.env.get("MONGODB_URL");

if (DB_CONN === undefined) {

throw new Error("Could not find environment variable: MONGODB_URL");

}

const client = new MongoClient(DB_CONN);

try {

await client.connect();

} catch (e) {

throw new Error("MongoDB connection failed: " + e);

}

return client;

}

  

async function init() {

const client = await initMongoClient();

const DB_NAME = Deno.env.get("DB_NAME");

if (DB_NAME === undefined) {

throw new Error("Could not find environment variable: DB_NAME");

}

return [client, DB_NAME] as [MongoClient, string];

}

  

async function dropAllCollections(db: Db): Promise<void> {

try {

// Get all collection names

const collections = await db.listCollections().toArray();

  

// Drop each collection

for (const collection of collections) {

await db.collection(collection.name).drop();

}

} catch (error) {

console.error("Error dropping collections:", error);

throw error;

}

}

  

/**

* MongoDB database configured by .env

* @returns {[Db, MongoClient]} initialized database and client

*/

export async function getDb() {

const [client, DB_NAME] = await init();

return [client.db(DB_NAME), client];

}

  

/**

* Test database initialization

* @returns {[Db, MongoClient]} initialized test database and client

*/

export async function testDb() {

const [client, DB_NAME] = await init();

const test_DB_NAME = `test-${DB_NAME}`;

const test_Db = client.db(test_DB_NAME);

await dropAllCollections(test_Db);

return [test_Db, client] as [Db, MongoClient];

}

  

/**

* Creates a fresh ID.

* @returns {ID} UUID v7 generic ID.

*/

export function freshID() {

return generate() as ID;

}
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

## Guide on how to implement concepts:

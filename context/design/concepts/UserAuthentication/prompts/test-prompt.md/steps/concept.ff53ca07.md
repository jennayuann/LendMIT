---
timestamp: 'Sun Oct 19 2025 01:09:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010901.719f99d4.md]]'
content_id: ff53ca0716f595638daa920aeda92d6f51578962cb2f5a12ebb58d25e6bf5e16
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

## Implementation of concept to write tests for:

```
// src/concepts/UserAuthentication.ts

  

import { Collection, Db } from "mongodb";

import { ID, Empty } from "@utils/types.ts";

import { freshID } from "@utils/database.ts";

import { db } from "@/db/connection.ts";

  

// --- Helper Functions for Password Hashing/Verification ---

  

/**

* Hashes a given password using SHA-256.

* In a production application, a more robust and secure hashing library like bcrypt (npm:bcrypt)

* should be used for password storage due to its resistance against brute-force attacks.

* This implementation uses Deno's Web Crypto API for demonstration.

* @param password The plain-text password to hash.

* @returns The SHA-256 hashed password as a hexadecimal string.

*/

async function hashPassword(password: string): Promise<string> {

const textEncoder = new TextEncoder();

const data = textEncoder.encode(password);

const hashBuffer = await crypto.subtle.digest("SHA-256", data);

const hashArray = Array.from(new Uint8Array(hashBuffer));

const hashedPassword = hashArray

.map((b) => b.toString(16).padStart(2, "0"))

.join("");

return hashedPassword;

}

  

/**

* Verifies if a plain-text password matches a stored hashed password.

* @param password The plain-text password to verify.

* @param hashedPassword The stored hashed password.

* @returns `true` if the passwords match, `false` otherwise.

*/

async function verifyPassword(

password: string,

hashedPassword: string,

): Promise<boolean> {

const newHashed = await hashPassword(password);

return newHashed === hashedPassword;

}

  

// --- Concept Enums and Interfaces ---

  

/**

* Defines the possible states of a user account.

*/

enum UserStatus {

VERIFIED = "VERIFIED",

UNVERIFIED = "UNVERIFIED",

DEACTIVATED = "DEACTIVATED",

}

  

/**

* Type alias for a User ID, leveraging type branding for clarity.

*/

type User = ID;

  

/**

* Represents a user account as stored in the 'UserAuthentication.useraccounts' collection.

*/

interface UserAccount {

_id: User;

email: string;

passwordHashed: string;

status: UserStatus;

}

  

/**

* Represents a verification code entry as stored in the 'UserAuthentication.verificationcodes' collection.

*/

interface VerificationCode {

_id: ID; // Unique ID for the verification code document itself

user: User; // References the _id of the associated UserAccount

code: string;

expiry: Date;

}

  

// --- UserAuthentication Class Implementation ---

  

/**

* Constant prefix for MongoDB collection names for this concept.

*/

const COLLECTION_PREFIX = "UserAuthentication.";

  

/**

* UserAuthentication concept: Manages user accounts, including creation, credential management,

* status, and the email verification process required for full account activation and login.

*

* principle: When a user registers with a unique email and password, their account is created

* but remains `UNVERIFIED`. The system sends a verification code to their email. If they correctly

* provide this code before it expires, their account `status` becomes `VERIFIED`. Only `VERIFIED`

* users can log in. A user may later change their password (if `VERIFIED`) or deactivate their account.

* If an account is `DEACTIVATED`, it cannot be used to log in until it is reactivated, returning

* to an `UNVERIFIED` state.

*/

export class UserAuthentication {

private userAccounts: Collection<UserAccount>;

private verificationCodes: Collection<VerificationCode>;

  

constructor(private readonly db: Db) {

this.userAccounts = this.db.collection(COLLECTION_PREFIX + "useraccounts");

this.verificationCodes = this.db.collection(

COLLECTION_PREFIX + "verificationcodes",

);

}

  

/**

* action: registerUser

* @param email - The user's email address (String).

* @param password - The user's password (String).

* @returns `{ user: User }` containing the newly created user ID on success.

* @returns `{ error: String }` containing a descriptive error message if the email is already in use.

*

* requires: `email` is unique and not currently associated with any existing `UserAccount` entry.

* effects: Creates a new `user` ID, associates it with `email`, a hashed version of `password`,

* and sets `status` to `UNVERIFIED`. Returns the newly created `user` ID.

*

* requires: `email` is already associated with an existing `UserAccount` entry.

* effects: Returns an `error` message indicating the email is already in use.

*/

async registerUser(

{ email, password }: { email: string; password: string },

): Promise<{ user: User } | { error: string }> {

const existingUser = await this.userAccounts.findOne({ email });

if (existingUser) {

return { error: "Email already in use." };

}

  

const userId = freshID();

const passwordHashed = await hashPassword(password);

  

const newUserAccount: UserAccount = {

_id: userId,

email,

passwordHashed,

status: UserStatus.UNVERIFIED,

};

  

await this.userAccounts.insertOne(newUserAccount);

return { user: userId };

}

  

/**

* action: sendVerificationCode

* @param user - The ID of the User (User).

* @param email - The email address associated with the user (String).

* @returns `Empty` object on successful generation and deletion of previous codes.

* @throws `Error` if the user account does not meet the requirements.

*

* requires: A `UserAccount` exists for `user` with the given `email`, and `status` is `UNVERIFIED`.

* No unexpired `VerificationCodes` exists for `user`.

* effects: Deletes any existing `VerificationCodes` for `user`. Creates a new `VerificationCodes` entry for `user`

* with a newly generated `code`, and an `expiry` time (e.g., 15 minutes from `currentTime`).

*/

async sendVerificationCode(

{ user, email }: { user: User; email: string },

): Promise<Empty> {

const userAccount = await this.userAccounts.findOne({ _id: user, email });

  

if (!userAccount) {

throw new Error("Requires: User account not found or email mismatch.");

}

if (userAccount.status !== UserStatus.UNVERIFIED) {

throw new Error(

"Requires: User account status is not UNVERIFIED. Current status: " +

userAccount.status,

);

}

  

const unexpiredCode = await this.verificationCodes.findOne({

user,

expiry: { $gt: new Date() },

});

  

if (unexpiredCode) {

throw new Error(

"Requires: An unexpired verification code already exists for this user.",

);

}

  

// Delete any existing codes for the user to ensure a clean slate for the new one.

await this.verificationCodes.deleteMany({ user });

  

// Generate a 6-character alphanumeric code

const code = Math.random().toString(36).substring(2, 8).toUpperCase();

const expiry = new Date(Date.now() + 15 * 60 * 1000); // Code expires in 15 minutes

  

const newVerificationCode: VerificationCode = {

_id: freshID(),

user,

code,

expiry,

};

  

await this.verificationCodes.insertOne(newVerificationCode);

return {};

}

  

/**

* action: verifyCode

* @param user - The ID of the User (User).

* @param code - The verification code provided by the user (String).

* @returns `{ verified: Boolean }` which is `true` if the code is valid and the account is verified, `false` otherwise.

*

* requires: An unexpired `VerificationCodes` exists for `user` with a matching `code`.

* The `UserAccount` for `user` exists and `status` is `UNVERIFIED`.

* effects: If the `requires` condition is met, deletes the matching `VerificationCodes` entry,

* sets the `status` for the `UserAccount` of `user` to `VERIFIED`, and returns `true`.

* Otherwise, returns `false`.

*/

async verifyCode(

{ user, code }: { user: User; code: string },

): Promise<{ verified: boolean }> {

const verificationEntry = await this.verificationCodes.findOne({

user,

code,

expiry: { $gt: new Date() }, // Ensure the code is not expired

});

  

if (!verificationEntry) {

// Code not found, mismatched, or expired

return { verified: false };

}

  

const userAccount = await this.userAccounts.findOne({ _id: user });

  

if (!userAccount || userAccount.status !== UserStatus.UNVERIFIED) {

// User account not found or not in the UNVERIFIED state, so cannot be verified

return { verified: false };

}

  

// All requirements met: delete the code, update user status, and return true

await this.verificationCodes.deleteOne({ _id: verificationEntry._id });

await this.userAccounts.updateOne(

{ _id: user },

{ $set: { status: UserStatus.VERIFIED } },

);

  

return { verified: true };

}

  

/**

* action: login

* @param email - The user's email (String).

* @param password - The user's password (String).

* @returns `{ user: User }` containing the user ID on successful login.

* @returns `{ error: String }` containing a descriptive error message on authentication failure.

*

* requires: A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`,

* and `status` is `VERIFIED`.

* effects: Returns the `user` ID associated with the matching credentials.

*

* requires: No `UserAccount` entry exists with `email`, or `passwordHashed` does not match `password`,

* or `status` is `DEACTIVATED` or `UNVERIFIED`.

* effects: Returns an `error` message indicating authentication failure.

*/

async login(

{ email, password }: { email: string; password: string },

): Promise<{ user: User } | { error: string }> {

const userAccount = await this.userAccounts.findOne({ email });

  

if (!userAccount) {

return { error: "Authentication failed: Invalid credentials." };

}

  

const isPasswordValid = await verifyPassword(

password,

userAccount.passwordHashed,

);

  

if (!isPasswordValid) {

return { error: "Authentication failed: Invalid credentials." };

}

  

if (

userAccount.status === UserStatus.DEACTIVATED ||

userAccount.status === UserStatus.UNVERIFIED

) {

return {

error:

`Authentication failed: Account status is ${userAccount.status}. Only VERIFIED accounts can log in.`,

};

}

  

// All requirements met for successful login

return { user: userAccount._id };

}

  

/**

* action: changePassword

* @param user - The ID of the User (User).

* @param newPassword - The new password for the user (String).

* @returns `Empty` object on successful password change.

* @throws `Error` if the user account does not meet the requirements.

*

* requires: A `UserAccount` entry for `user` exists and `status` is `VERIFIED`.

* effects: Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.

*/

async changePassword(

{ user, newPassword }: { user: User; newPassword: string },

): Promise<Empty> {

const userAccount = await this.userAccounts.findOne({ _id: user });

  

if (!userAccount) {

throw new Error("Requires: User account not found.");

}

if (userAccount.status !== UserStatus.VERIFIED) {

throw new Error(

"Requires: Account must be VERIFIED to change password. Current status: " +

userAccount.status,

);

}

  

const newPasswordHashed = await hashPassword(newPassword);

  

await this.userAccounts.updateOne(

{ _id: user },

{ $set: { passwordHashed: newPasswordHashed } },

);

return {};

}

  

/**

* action: activateUser

* @param user - The ID of the User (User).

* @returns `Empty` object on successful account activation.

* @throws `Error` if the user account does not meet the requirements.

*

* requires: A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.

* effects: Sets the `status` for `user` to `UNVERIFIED`.

*/

async activateUser({ user }: { user: User }): Promise<Empty> {

const userAccount = await this.userAccounts.findOne({ _id: user });

  

if (!userAccount) {

throw new Error("Requires: User account not found.");

}

if (userAccount.status !== UserStatus.DEACTIVATED) {

throw new Error(

"Requires: Account must be DEACTIVATED to activate. Current status: " +

userAccount.status,

);

}

  

await this.userAccounts.updateOne(

{ _id: user },

{ $set: { status: UserStatus.UNVERIFIED } },

);

return {};

}

  

/**

* action: deactivateUser

* @param user - The ID of the User (User).

* @returns `Empty` object on successful account deactivation.

* @throws `Error` if the user account does not meet the requirements.

*

* requires: A `UserAccount` entry for `user` exists and `status` is `VERIFIED` or `UNVERIFIED`.

* effects: Sets the `status` for `user` to `DEACTIVATED`.

*/

async deactivateUser({ user }: { user: User }): Promise<Empty> {

const userAccount = await this.userAccounts.findOne({ _id: user });

  

if (!userAccount) {

throw new Error("Requires: User account not found.");

}

if (

userAccount.status !== UserStatus.VERIFIED &&

userAccount.status !== UserStatus.UNVERIFIED

) {

throw new Error(

"Requires: Account must be VERIFIED or UNVERIFIED to deactivate (e.g., it is already DEACTIVATED). Current status: " +

userAccount.status,

);

}

  

await this.userAccounts.updateOne(

{ _id: user },

{ $set: { status: UserStatus.DEACTIVATED } },

);

return {};

}

  

/**

* action: revokeVerification

* @param user - The ID of the User (User).

* @returns `Empty` object on successful revocation.

* @throws `Error` if no verification codes exist for the specified user.

*

* requires: One or more `VerificationCodes` entries exist for `user`.

* effects: Deletes all `VerificationCodes` entries associated with `user`.

*/

async revokeVerification({ user }: { user: User }): Promise<Empty> {

const existingCodesCount = await this.verificationCodes.countDocuments({

user,

});

  

if (existingCodesCount === 0) {

throw new Error(

"Requires: No verification codes found for this user to revoke.",

);

}

  

await this.verificationCodes.deleteMany({ user });

return {};

}

  

/**

* action: system cleanExpiredCodes

* @returns `Empty` object upon completion.

*

* requires: There are `VerificationCodes` entries where `currentTime >= expiry`.

* effects: Deletes all `VerificationCodes` entries that have expired.

*/

async cleanExpiredCodes(): Promise<Empty> {

// This operation implicitly satisfies the "requires" condition:

// if no codes are expired, the deleteMany operation will simply affect zero documents,

// which is a valid and expected outcome for a cleanup task.

await this.verificationCodes.deleteMany({ expiry: { $lte: new Date() } });

return {};

}

}

  

// Export an instantiated instance of the UserAuthentication class

export const userAuthentication = new UserAuthentication(db);
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

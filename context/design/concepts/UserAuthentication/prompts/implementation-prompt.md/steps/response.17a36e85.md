---
timestamp: 'Sun Oct 19 2025 01:01:09 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010109.2b10ca7e.md]]'
content_id: 17a36e859965a9ef1b5ef04bff00aef75cbe21b2dca3718186d9c439d31ea53d
---

# response:

To implement the `UserAuthentication` concept in TypeScript for Deno with MongoDB, we'll create a class `UserAuthentication` that encapsulates all the specified actions. We'll define interfaces for `UserAccount` and `VerificationCode` to model the concept's state.

Since `@utils/types.ts` and `@utils/database.ts` are not provided, we will define necessary helper types (`ID`, `Empty`) and utility functions (`freshID`, `hashPassword`, `verifyPassword`, `generateVerificationCode`) directly within the concept file for self-containment.

The MongoDB collections will be named using the concept prefix (`UserAuthentication.`) followed by the plural form of the state entities (`useraccounts`, `verificationcodes`), e.g., `UserAuthentication.useraccounts`.

Error handling will follow the guide: return `{ error: "message" }` for specified error cases (like `registerUser` with duplicate email, or `login` failures) and throw `Error` for other unmet `requires` conditions where no specific error return type is defined.

```typescript
// src/concepts/UserAuthentication.ts

import { Collection, Db } from "npm:mongodb";
import { db } from "@/db/connection.ts";

// --- Start of helper types and functions (as `@utils` modules were not provided) ---

/**
 * A branded string type to represent unique identifiers within the system.
 * This helps distinguish IDs from plain strings at compile time.
 */
type ID = string & { __brand: "ID" };

/**
 * An empty record type used for actions that do not return any specific data.
 */
type Empty = Record<PropertyKey, never>;

/**
 * Generates a new unique ID. Prefixed with 'ua_' for UserAuthentication context.
 * Uses `crypto.randomUUID()` for robust uniqueness.
 */
function freshID(): ID {
  return `ua_${crypto.randomUUID().replace(/-/g, "")}` as ID;
}

/**
 * Hashes a given password using SHA-256.
 * @param password The plain text password to hash.
 * @returns A promise that resolves to the hexadecimal string representation of the hash.
 */
async function hashPassword(password: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifies if a plain text password matches a given hashed password.
 * @param password The plain text password.
 * @param hashedPassword The stored hashed password.
 * @returns A promise that resolves to `true` if passwords match, `false` otherwise.
 */
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const incomingHashed = await hashPassword(password);
  return incomingHashed === hashedPassword;
}

/**
 * Generates a random 6-digit verification code.
 * @returns A string representing the 6-digit code.
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// --- End of helper types and functions ---


/**
 * Enum for the possible statuses of a UserAccount.
 */
enum UserStatus {
  UNVERIFIED = "UNVERIFIED",
  VERIFIED = "VERIFIED",
  DEACTIVATED = "DEACTIVATED",
}

/**
 * Interface representing a UserAccount entry in the database.
 *
 * State:
 * - `user` User
 * - `email` String
 * - `passwordHashed` String
 * - `status` of VERIFIED or UNVERIFIED or DEACTIVATED (default `UNVERIFIED`)
 */
interface UserAccount {
  _id: ID; // The unique ID for the user account (User).
  email: string;
  passwordHashed: string;
  status: UserStatus;
}

/**
 * Interface representing a VerificationCode entry in the database.
 *
 * State:
 * - `user` User (referencing the `user` ID from `UserAccounts`)
 * - `code` String
 * - `expiry` DateTime
 */
interface VerificationCode {
  _id: ID; // Unique ID for the verification code document itself.
  userId: ID; // References the `_id` of the UserAccount.
  code: string;
  expiry: Date;
}

// Declare collection prefix using the concept name as per guide.
const CONCEPT_PREFIX = "UserAuthentication.";

/**
 * UserAuthentication concept: Manage user accounts, including creation, credential management,
 * status, and the email verification process required for full account activation and login.
 *
 * Principle: When a user registers with a unique email and password, their account is created
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
    this.userAccounts = this.db.collection(CONCEPT_PREFIX + "useraccounts");
    this.verificationCodes = this.db.collection(CONCEPT_PREFIX + "verificationcodes");
  }

  /**
   * `registerUser (email: String, password: String): (user: User)`
   * `registerUser (email: String, password: String): (error: String)`
   *
   * Requires: `email` is unique and not currently associated with any existing `UserAccount` entry.
   * Effects: Creates a new `user` ID, associates it with `email`, a hashed version of `password`,
   *          and sets `status` to `UNVERIFIED`. Returns the newly created `user` ID.
   *
   * Requires (error case): `email` is already associated with an existing `UserAccount` entry.
   * Effects (error case): Returns an `error` message indicating the email is already in use.
   */
  async registerUser({ email, password }: { email: string; password: string }): Promise<{ user: ID } | { error: string }> {
    // Check if email is already in use
    const existingUser = await this.userAccounts.findOne({ email });
    if (existingUser) {
      return { error: "Email already in use." };
    }

    const hashedPassword = await hashPassword(password);
    const newUserId = freshID();

    const newUserAccount: UserAccount = {
      _id: newUserId,
      email,
      passwordHashed: hashedPassword,
      status: UserStatus.UNVERIFIED,
    };

    await this.userAccounts.insertOne(newUserAccount);
    return { user: newUserId };
  }

  /**
   * `sendVerificationCode (user: User, email: String): Empty`
   *
   * Requires: A `UserAccount` exists for `user` with the given `email`, and `status` is `UNVERIFIED`.
   *           No unexpired `VerificationCodes` exists for `user`.
   * Effects: Deletes any existing `VerificationCodes` for `user`. Creates a new `VerificationCodes`
   *          entry for `user` with a newly generated `code`, and an `expiry` time
   *          (e.g., 15 minutes from `currentTime`).
   */
  async sendVerificationCode({ user, email }: { user: ID; email: string }): Promise<Empty> {
    // Requires: A `UserAccount` exists for `user` with the given `email`, and `status` is `UNVERIFIED`.
    const userAccount = await this.userAccounts.findOne({ _id: user, email });
    if (!userAccount || userAccount.status !== UserStatus.UNVERIFIED) {
      throw new Error("User account not found, email mismatch, or not in UNVERIFIED status.");
    }

    // Effects: Deletes any existing `VerificationCodes` for `user`.
    // This implicitly handles the "No unexpired VerificationCodes exists" requirement
    // by ensuring only one (the new one) will exist.
    await this.verificationCodes.deleteMany({ userId: user });

    // Effects: Creates a new `VerificationCodes` entry for `user` with a newly generated `code`,
    // and an `expiry` time (e.g., 15 minutes from `currentTime`).
    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const newVerificationCode: VerificationCode = {
      _id: freshID(),
      userId: user,
      code,
      expiry,
    };

    await this.verificationCodes.insertOne(newVerificationCode);
    return {};
  }

  /**
   * `verifyCode (user: User, code: String): (verified: Boolean)`
   *
   * Requires: An unexpired `VerificationCodes` exists for `user` with a matching `code`.
   *           The `UserAccount` for `user` exists and `status` is `UNVERIFIED`.
   * Effects: If the `requires` condition is met, deletes the matching `VerificationCodes` entry,
   *          sets the `status` for the `UserAccount` of `user` to `VERIFIED`, and returns `true`.
   *          Otherwise, returns `false`.
   */
  async verifyCode({ user, code }: { user: ID; code: string }): Promise<{ verified: boolean }> {
    const currentTime = new Date();

    // Requires: An unexpired `VerificationCodes` exists for `user` with a matching `code`.
    const verificationEntry = await this.verificationCodes.findOne({
      userId: user,
      code,
      expiry: { $gt: currentTime }, // code is unexpired
    });

    if (!verificationEntry) {
      return { verified: false };
    }

    // Requires: The `UserAccount` for `user` exists and `status` is `UNVERIFIED`.
    const userAccount = await this.userAccounts.findOne({ _id: user });
    if (!userAccount || userAccount.status !== UserStatus.UNVERIFIED) {
      // If code was found but user account state is invalid, delete the verification code
      // as it's no longer useful or correct.
      await this.verificationCodes.deleteOne({ _id: verificationEntry._id });
      return { verified: false };
    }

    // Effects: If the `requires` condition is met:
    // 1. Deletes the matching `VerificationCodes` entry.
    await this.verificationCodes.deleteOne({ _id: verificationEntry._id });

    // 2. Sets the `status` for the `UserAccount` of `user` to `VERIFIED`.
    await this.userAccounts.updateOne(
      { _id: user },
      { $set: { status: UserStatus.VERIFIED } },
    );

    // 3. Returns `true`.
    return { verified: true };
  }

  /**
   * `login (email: String, password: String): (user: User)`
   * `login (email: String, password: String): (error: String)`
   *
   * Requires: A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`,
   *           and `status` is `VERIFIED`.
   * Effects: Returns the `user` ID associated with the matching credentials.
   *
   * Requires (error case): No `UserAccount` entry exists with `email`, or `passwordHashed`
   *                        does not match `password`, or `status` is `DEACTIVATED` or `UNVERIFIED`.
   * Effects (error case): Returns an `error` message indicating authentication failure.
   */
  async login({ email, password }: { email: string; password: string }): Promise<{ user: ID } | { error: string }> {
    const userAccount = await this.userAccounts.findOne({ email });

    // Check if user account exists
    if (!userAccount) {
      return { error: "Authentication failed: Invalid credentials." };
    }

    // Check password
    const passwordMatches = await verifyPassword(password, userAccount.passwordHashed);
    if (!passwordMatches) {
      return { error: "Authentication failed: Invalid credentials." };
    }

    // Check status
    if (userAccount.status !== UserStatus.VERIFIED) {
      const statusError = userAccount.status === UserStatus.UNVERIFIED
        ? "Authentication failed: Account not verified."
        : "Authentication failed: Account deactivated.";
      return { error: statusError };
    }

    // All requirements met, return user ID
    return { user: userAccount._id };
  }

  /**
   * `changePassword (user: User, newPassword: String): Empty`
   *
   * Requires: A `UserAccount` entry for `user` exists and `status` is `VERIFIED`.
   * Effects: Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.
   */
  async changePassword({ user, newPassword }: { user: ID; newPassword: string }): Promise<Empty> {
    // Requires: A `UserAccount` entry for `user` exists and `status` is `VERIFIED`.
    const userAccount = await this.userAccounts.findOne({ _id: user });
    if (!userAccount || userAccount.status !== UserStatus.VERIFIED) {
      throw new Error("User account not found or not in VERIFIED status.");
    }

    // Effects: Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.
    const newPasswordHashed = await hashPassword(newPassword);
    await this.userAccounts.updateOne(
      { _id: user },
      { $set: { passwordHashed: newPasswordHashed } },
    );
    return {};
  }

  /**
   * `activateUser (user: User): Empty`
   *
   * Requires: A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.
   * Effects: Sets the `status` for `user` to `UNVERIFIED`.
   */
  async activateUser({ user }: { user: ID }): Promise<Empty> {
    // Requires: A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.
    const userAccount = await this.userAccounts.findOne({ _id: user });
    if (!userAccount || userAccount.status !== UserStatus.DEACTIVATED) {
      throw new Error("User account not found or not in DEACTIVATED status.");
    }

    // Effects: Sets the `status` for `user` to `UNVERIFIED`.
    await this.userAccounts.updateOne(
      { _id: user },
      { $set: { status: UserStatus.UNVERIFIED } },
    );
    return {};
  }

  /**
   * `deactivateUser (user: User): Empty`
   *
   * Requires: A `UserAccount` entry for `user` exists and `status` is `VERIFIED` or `UNVERIFIED`.
   * Effects: Sets the `status` for `user` to `DEACTIVATED`.
   */
  async deactivateUser({ user }: { user: ID }): Promise<Empty> {
    // Requires: A `UserAccount` entry for `user` exists and `status` is `VERIFIED` or `UNVERIFIED`.
    const userAccount = await this.userAccounts.findOne({ _id: user });
    if (!userAccount || (userAccount.status !== UserStatus.VERIFIED && userAccount.status !== UserStatus.UNVERIFIED)) {
      throw new Error("User account not found or already DEACTIVATED.");
    }

    // Effects: Sets the `status` for `user` to `DEACTIVATED`.
    await this.userAccounts.updateOne(
      { _id: user },
      { $set: { status: UserStatus.DEACTIVATED } },
    );
    return {};
  }

  /**
   * `revokeVerification (user: User): Empty`
   *
   * Requires: One or more `VerificationCodes` entries exist for `user`.
   * Effects: Deletes all `VerificationCodes` entries associated with `user`.
   */
  async revokeVerification({ user }: { user: ID }): Promise<Empty> {
    // Requires: One or more `VerificationCodes` entries exist for `user`.
    const existingCodesCount = await this.verificationCodes.countDocuments({ userId: user });
    if (existingCodesCount === 0) {
      throw new Error("No verification codes found for the user to revoke.");
    }

    // Effects: Deletes all `VerificationCodes` entries associated with `user`.
    await this.verificationCodes.deleteMany({ userId: user });
    return {};
  }

  /**
   * `system cleanExpiredCodes (): Empty`
   *
   * Requires: There are `VerificationCodes` entries where `currentTime >= expiry`.
   * Effects: Deletes all `VerificationCodes` entries that have expired.
   */
  async cleanExpiredCodes(): Promise<Empty> {
    const currentTime = new Date();

    // Effects: Deletes all `VerificationCodes` entries that have expired.
    // The `deleteMany` operation handles the "requires" implicitly; it will delete 0 documents
    // if no expired codes are found, which is a valid outcome for the effect.
    await this.verificationCodes.deleteMany({ expiry: { $lte: currentTime } });
    return {};
  }
}

// Export the instantiated class for use throughout the application.
export const userAuthentication = new UserAuthentication(db);
```

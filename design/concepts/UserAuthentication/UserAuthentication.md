# concept: UserAuthentication

- **concept**: UserAuthentication [User]

- **purpose**: Manage user accounts, including creation, credential management, status, and the email verification process required for full account activation and login.

- **principle**: When a user registers with a unique email and password, their account is created but remains `UNVERIFIED`. The system sends a verification code to their email. If they correctly provide this code before it expires, their account `status` becomes `VERIFIED`. Only `VERIFIED` users can log in. A user may later change their password (if `VERIFIED`) or deactivate their account. If an account is `DEACTIVATED`, it cannot be used to log in until it is reactivated, returning to an `UNVERIFIED` state.

- **state**:

    - a set of `UserAccounts` with
        - `user` User
        - `email` String
        - `passwordHashed` String
        - `status` of VERIFIED or UNVERIFIED or DEACTIVATED (default `UNVERIFIED`)
    - a set of `VerificationCodes` with
        - `user` User (referencing the `user` ID from `UserAccounts`)
        - `code` String
        - `expiry` DateTime
- **actions**:

    - `registerUser (email: String, password: String): (user: User)`
        - **requires**: `email` is unique and not currently associated with any existing `UserAccount` entry.
        - **effects**: Creates a new `user` ID, associates it with `email`, a hashed version of `password`, and sets `status` to `UNVERIFIED`. Returns the newly created `user` ID.
    - `registerUser (email: String, password: String): (error: String)`
        - **requires**: `email` is already associated with an existing `UserAccount` entry.
        - **effects**: Returns an `error` message indicating the email is already in use.
    - `sendVerificationCode (user: User, email: String): Empty`
        - **requires**: A `UserAccount` exists for `user` with the given `email`, and `status` is `UNVERIFIED`. No unexpired `VerificationCodes` exists for `user`.
        - **effects**: Deletes any existing `VerificationCodes` for `user`. Creates a new `VerificationCodes` entry for `user` with a newly generated `code`, and an `expiry` time (e.g., 15 minutes from `currentTime`).
    - `verifyCode (user: User, code: String): (verified: Boolean)`
        - **requires**: An unexpired `VerificationCodes` exists for `user` with a matching `code`. The `UserAccount` for `user` exists and `status` is `UNVERIFIED`.
        - **effects**: If the `requires` condition is met, deletes the matching `VerificationCodes` entry, sets the `status` for the `UserAccount` of `user` to `VERIFIED`, and returns `true`. Otherwise, returns `false`.
    - `login (email: String, password: String): (user: User)`
        - **requires**: A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`, and `status` is `VERIFIED`.
        - **effects**: Returns the `user` ID associated with the matching credentials.
    - `login (email: String, password: String): (error: String)`
        - **requires**: No `UserAccount` entry exists with `email`, or `passwordHashed` does not match `password`, or `status` is `DEACTIVATED` or `UNVERIFIED`.
        - **effects**: Returns an `error` message indicating authentication failure.
    - `getEmail (user: User): (email: String)`
        - **requires**: A `UserAccount` entry for `user` exists.
        - **effects**: Returns the `email` for the specified `user`.
    - `changePassword (user: User, newPassword: String): Empty`
        - **requires**: A `UserAccount` entry for `user` exists and `status` is `VERIFIED`.
        - **effects**: Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.
    - `activateUser (user: User): Empty`
        - **requires**: A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.
        - **effects**: Sets the `status` for `user` to `UNVERIFIED`.
    - `deactivateUser (user: User): Empty`
        - **requires**: A `UserAccount` entry for `user` exists and `status` is `VERIFIED` or `UNVERIFIED`.
        - **effects**: Sets the `status` for `user` to `DEACTIVATED`.
    - `revokeVerification (user: User): Empty`
        - **requires**: One or more `VerificationCodes` entries exist for `user`.
        - **effects**: Deletes all `VerificationCodes` entries associated with `user`.
    - `system cleanExpiredCodes (): Empty`
        - **requires**: There are `VerificationCodes` entries where `currentTime >= expiry`.
        - **effects**: Deletes all `VerificationCodes` entries that have expired.

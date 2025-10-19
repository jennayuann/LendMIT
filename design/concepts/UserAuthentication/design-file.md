# UserAuthentication — Design Changes & Issues

## Summary of Changes

The primary change is the **consolidation of user account management and email verification functionality** into a single `UserAuthentication` concept.

Key specific changes include:

1.  **Consolidated Authentication and Verification**: Merged the authentication-related aspects of the original `User` concept with the `EmailAuth` concept.
2.  **Generic `User` Type**: Now uses a generic `User` type parameter (`[User]`) for user identifiers, shedding non-authentication-specific attributes.
3.  **Refined Status Model**: `UserAccounts` status evolved to `UNVERIFIED`, `VERIFIED`, `DEACTIVATED`, with `VERIFIED` users solely eligible for `login`.
4.  **Integrated Email Verification**: All aspects of email verification (code generation, expiry, matching, status update) are now internal, including `VerificationCodes` state and actions.
5.  **Password Hashing**: Explicitly includes `passwordHashed` in state for security.
6.  **Explicit Error Handling**: Actions define explicit success (`(user: User)`) and error (`(error: String)`) return signatures.
7.  **Reactivation Flow**: A deactivated user reactivates to an `UNVERIFIED` state, requiring re-verification.
8.  **System Cleanup Action**: Introduced `system cleanExpiredCodes` to manage expired verification codes.

## Explaining Changes and Design Decisions

### Consolidation of Authentication Logic (User & EmailAuth)

*   **Change**: The authentication-specific responsibilities of the original `User` concept and the entirety of the `EmailAuth` concept were merged into `UserAuthentication`. This concept now internally manages user identity (via a generic `User` type), account credentials, and the full email verification lifecycle. Non-authentication-specific user attributes like `firstName` or `lastName` have been removed.

### Generic User Identity & Refined Status Model

*   **Change**: `UserAuthentication` now uses a generic `User` type parameter (`[User]`) instead of defining a separate User concept and features a refined `status` model for `UserAccounts` (`UNVERIFIED`, `VERIFIED`, `DEACTIVATED`) from the previous (`PENDING`, `REGISTERED`, `DEACTIVATED`).

### Enhanced Security and Clarity

*   **Changes**: `UserAuthentication` now explicitly includes `passwordHashed` in its state, defines distinct return signatures for success and error in actions like `registerUser` and `login`, implements a reactivation flow that returns accounts to `UNVERIFIED` status, and includes a `system cleanExpiredCodes` action to clear expired verification codes.

## Issues Encountered

1.  **Cluttering UserAuthentication**: As I merged EmailAuth, I'm worried that UserAuthentication is now at risk of being too large and not modular enough.
2. **Resend Verification Code Hardening**: There's the issue of unlimited `sendVerificationCode` and unlimited verify attempts, which can lead to spam or brute forcing. To deal with that, I can add a temporary lockout later on. 
3. **Password Hashing**: How passwords will be hashed to keep user's data secured.

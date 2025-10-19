---
timestamp: 'Thu Oct 16 2025 18:05:09 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_180509.301cab86.md]]'
content_id: e3e5c00830e68f0c2f19995ab4c0c0fb4193b3d742c88b823b9f69e54f11f483
---

# Design File: User Profile Concept Refinement

## 1. Introduction

This design file outlines the changes made to the `User` and `UserProfile` concepts, addressing the identified redundancy and clarifying the responsibilities of each concept. The primary goal is to establish a clear separation between a user's core identity and their mutable descriptive profile information.

## 2. Problem Statement: Redundancy of `firstName` and `lastName`

In the initial Assignment 2 concepts, the `User` concept included `firstName` and `lastName` as part of its state. Simultaneously, the newly introduced `UserProfile` concept also included `firstName` and `lastName` as part of its state, along with `bio` and `thumbnail`. This leads to a redundancy where the same attributes (`firstName` and `lastName`) exist in two different concepts, creating ambiguity regarding:

* **Source of Truth:** Which concept holds the definitive `firstName` and `lastName`?
* **Mutability:** The `User` concept had no explicit actions to change `firstName` or `lastName`, implying they were immutable post-registration. The `UserProfile` concept, however, explicitly provides `updateProfile` for these attributes, implying mutability. This conflict needed resolution.
* **Separation of Concerns:** The `User` concept's purpose is to "provide an identity," while `UserProfile`'s purpose is to "manage mutable, descriptive attributes." `firstName` and `lastName` are descriptive and often mutable (e.g., legal name changes, preferred names), making them a better fit for `UserProfile`.

## 3. Proposed Solution: Relocate `firstName` and `lastName` to `UserProfile`

To resolve this redundancy and enforce a clearer separation of concerns, `firstName` and `lastName` will be moved exclusively to the `UserProfile` concept. The `User` concept will focus purely on identity, authentication, and account status, while `UserProfile` will manage all mutable, descriptive details associated with that identity.

### Integration during User Registration:

When a new user registers, the `User.registerUser` action will be responsible for two key effects:

1. Creating the core `User` identity (email, password, status).
2. Triggering the creation of an initial `UserProfile` for that new `User`, utilizing the `firstName` and `lastName` provided during registration. This ensures that every `User` automatically has an associated `UserProfile` initialized with basic information.

## 4. Changes to Concept 1: User

The `User` concept will be modified as follows:

### `state` changes:

* Removed `firstName String`.
* Removed `lastName String`.

**Revised `User` `state`:**

```
state
a set of Users with
an email String
a password String
a status of PENDING OR REGISTERED or DEACTIVATED
```

### `actions.registerUser` changes:

* The `firstName` and `lastName` parameters will remain in the `registerUser` action's signature, as this is the point where a user initially provides this information.
* The `effect` will be updated to explicitly state the creation of both the `User` record and an associated `UserProfile`.

**Revised `User.registerUser` action:**

```
registerUser(email: String, password: String, firstName: String, lastName: String)
requires: no existing User with this email
effect:
  1. a new User is created with the given email, password, and status = PENDING.
  2. The createProfile action of the UserProfile concept is invoked for this new User with the given firstName, lastName, and default null bio/thumbnail.
```

No other actions (`changePassword`, `activateUser`, `deactivateUser`) in the `User` concept require modification as they do not interact with `firstName` or `lastName`.

## 5. Clarifications to Concept: UserProfile

The `UserProfile` concept's state and purpose are well-defined for managing mutable descriptive attributes. The only necessary clarification pertains to its `createProfile` action and how it integrates with `User` registration.

### `state`:

* No changes needed. The `firstName` and `lastName` attributes are correctly placed here.

### `actions.createProfile` clarification:

The `createProfile` action is critical for initializing a `UserProfile` record. Its primary invocation will be by the `User.registerUser` action.

**Clarified `UserProfile.createProfile` action:**

```
createProfile (user: User, firstName: String, lastName: String, bio: String? = null, thumbnail: String? = null): Empty
requires: No Profile entry for user currently exists.
effects: Creates a new Profile entry for the given user with the provided firstName, lastName, and optional bio and thumbnail.
         If bio or thumbnail are not provided, they are initialized as null.
Note: This action is typically invoked by the User.registerUser action during user registration to ensure every new User has an associated Profile. Direct invocation might be reserved for administrative or recovery scenarios.
```

### Other `UserProfile` actions:

* `updateProfile`, `deleteProfile`, and `getProfile` remain unchanged, as their definitions correctly support the management of mutable descriptive attributes, including `firstName` and `lastName`.

## 6. Rationale

This design achieves the following benefits:

* **Clear Separation of Concerns:** `User` is solely responsible for identity and authentication. `UserProfile` is solely responsible for descriptive, mutable attributes.
* **Single Source of Truth:** `firstName` and `lastName` now reside exclusively in `UserProfile`, eliminating data duplication and ambiguity.
* **Explicit Mutability:** It is now clear that `firstName` and `lastName` are intended to be mutable via the `UserProfile.updateProfile` action, aligning with common application requirements.
* **Automatic Profile Initialization:** Ensures that every registered `User` automatically has a corresponding `UserProfile` record, preventing orphaned `User` identities without basic profile information.

## 7. Other Considerations

* **MIT Email Note (User Concept):** The note regarding the requirement for an MIT email for verification remains relevant and is orthogonal to these changes. It implies an additional check during `activateUser` or `sendVerificationCode` but does not impact the structural separation of `firstName`/`lastName`.
* **Generic Types (Subscriptions):** The `Note` in `Subscriptions` about `Events` being `Postings` and `Tags` being `Categories` is a usage clarification for that specific concept and does not affect the `User` or `UserProfile` design.
* **Data Integrity:** By making `User.registerUser` responsible for creating both the `User` and the `UserProfile`, we enforce an invariant that a `User` identity will always have an associated `UserProfile`. This simplifies future logic that might assume a profile exists for any `REGISTERED` user.

# Previous Assignment 2 Concepts:
[@original-concepts](../../../background/original-concepts.md)

# Current UserProfile Concept:
[@UserProfile](../UserProfile.md)

# Task:
- Create a concise design file explaining changes you made to the concept as specified in Assignment 2 and any other issues that came up (in markdown).
- Take inspiration from the design file for UserAuthentication concept.

## UserAuthentication Design File:
[@design-file](../../UserAuthentication/design-file.md)
# response:

# UserProfile — Design Changes & Issues

## Summary of Changes

The `UserProfile` concept was introduced to provide a clear separation of concerns, focusing exclusively on managing mutable, descriptive attributes of a user, distinct from core identity and authentication.

Key specific changes include:

1.  **Separation from Core User Identity**: The descriptive attributes (`firstName`, `lastName`) were extracted from the previous monolithic `User` concept, which now focuses on authentication and identity (e.g., in `UserAuthentication`).
2.  **Generic User Linkage**: `UserProfile` uses a generic `User` type parameter (`[User]`) to link profiles to an abstract user identifier, allowing it to remain decoupled from the specifics of how a `User` entity is defined elsewhere.
3.  **Enriched Profile Information**: New optional attributes, `bio` (biography) and `thumbnail` (profile image URL/identifier), were added to provide a more comprehensive user profile.
4.  **Standard CRUD Operations**: A clear set of Create, Read, Update, and Delete actions (`createProfile`, `getProfile`, `updateProfile`, `deleteProfile`) were defined for robust management of profile data.
5.  **Granular Update Semantics**: The `updateProfile` action offers precise control, allowing specific attributes to be updated, explicitly cleared (by providing `null`), or left unchanged (by omitting the argument).

## Explaining Changes, Design Decisions, and Rationale

### Separation of Concerns: Descriptive Attributes vs. Core Identity

*   **Change**: The original `User` concept in Assignment 2 combined authentication credentials (`email`, `password`, `status`) with descriptive attributes (`firstName`, `lastName`). The `UserProfile` concept was created to specifically manage the *descriptive* part, while the authentication aspects were moved to `UserAuthentication`. The `firstName` and `lastName` attributes are now primarily managed within `UserProfile`.
*   **Rationale**: This is a fundamental design decision aimed at improving modularity and maintainability. By separating concerns, `UserProfile` becomes responsible solely for a user's public-facing or descriptive information. This reduces the complexity of individual concepts, making them easier to understand, implement, and evolve independently. For instance, updating a user's biography does not require interaction with the authentication system, and vice-versa. This also establishes `UserProfile` as the canonical source for these descriptive details.

### Generic User Identifier for Enhanced Modularity

*   **Change**: `UserProfile` is defined with a generic type parameter `[User]`. This means it doesn't define the `User` itself, but rather references an abstract `User` entity.
*   **Rationale**: This design choice enhances decoupling. `UserProfile` can be linked to any concrete representation of a user (e.g., an ID from `UserAuthentication`, an `email` string, or an internal user ID) without `UserProfile` needing to know the specific structure or management of that core `User` entity. This makes `UserProfile` highly reusable and adaptable across different parts of the system or even different underlying user management strategies.

### Introduction of Richer Profile Information

*   **Change**: New optional attributes, `bio` (a string for a personal biography) and `thumbnail` (a string representing an image URL or identifier), were added to the `Profile` state.
*   **Rationale**: The initial `User` concept was quite basic, primarily serving identification and authentication. To enable a more engaging and functional platform where participants can express themselves and be recognized, richer descriptive attributes are necessary. `bio` and `thumbnail` are standard components of user profiles that allow for personalization and better identification within a social or collaborative system.

### Granular and Flexible Profile Updates

*   **Change**: The `updateProfile` action was designed with specific, nuanced behavior regarding its optional arguments:
    *   Providing a non-`null` value updates the corresponding attribute.
    *   Providing `null` for an attribute *explicitly clears* that attribute (sets it to `null`).
    *   Omitting an argument entirely leaves the corresponding attribute *unchanged*.
*   **Rationale**: This granular control provides maximum flexibility for users and administrators. It allows for partial updates (e.g., changing only the `bio`), explicit clearing of optional fields (e.g., removing a `thumbnail`), and avoids accidental overwrites or the need for multiple, less precise update actions. This reduces client-side logic required to manage updates effectively.

## Issues Encountered

1.  **Ambiguity of `firstName`/`lastName` as a Canonical Source**:
    *   **Issue**: While `UserAuthentication` removed `firstName` and `lastName`, the initial `User` concept (Assignment 2) *did* include them. If another `User` concept were to exist that retains these, it could create redundancy or confusion about which source is the definitive one for a user's name.
    *   **Resolution/Decision**: The design implicitly establishes `UserProfile` as the *canonical and mutable* source for descriptive names (`firstName`, `lastName`) and other descriptive attributes (`bio`, `thumbnail`). Any other concept, like `UserAuthentication`, should primarily manage a unique `User` identifier and authentication credentials, avoiding duplication of descriptive data. If `firstName` and `lastName` are needed during initial registration in `UserAuthentication`, it is understood that `UserProfile` will then become the primary manager of these details post-registration.

2.  **Abstraction Level of `thumbnail` Storage**:
    *   **Issue**: The `thumbnail` attribute is defined as a `String? (representing an image URL or identifier)`. This is intentionally abstract and doesn't specify *how* the image data is stored or retrieved (e.g., a direct public URL, an internal ID referencing a file storage service, a base64 encoded string).
    *   **Resolution/Decision**: For a conceptual design file, this level of abstraction is appropriate. The concept focuses on the *existence* of a thumbnail and its logical representation, not the underlying infrastructure for image storage and delivery. Further system design (e.g., in an architecture diagram or API specification) would detail the specific implementation of `thumbnail` (e.g., integration with a CDN, blob storage, etc.).

3.  **Absence of Explicit Authorization Logic**:
    *   **Issue**: The concept defines `createProfile`, `updateProfile`, and `deleteProfile` actions, but the `requires` clauses only specify data validity and state preconditions, not *who* is authorized to perform these actions (e.g., only the `user` themselves, or an administrator).
    *   **Resolution/Decision**: In concept definitions, authorization concerns are typically abstracted away or handled by a separate, overarching Authorization concept. The `requires` clauses focus on ensuring the conceptual model's integrity and state transitions. Adding authorization logic directly into every concept would clutter the definitions and reduce their modularity. It is assumed that an external system or policy layer would enforce access control rules based on the authenticated user's identity and roles.
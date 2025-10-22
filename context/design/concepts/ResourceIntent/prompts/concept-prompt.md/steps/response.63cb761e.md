---
timestamp: 'Tue Oct 21 2025 13:41:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_134105.48698c36.md]]'
content_id: 63cb761e430043cf0dde0e4cbdc79b1144f6794ce0140dae016ddf61eee5143f
---

# response:

The `ResourceIntent` concept, in its initial form, was well-structured but contained internal dependencies on external concepts, specifically regarding resource ownership. This violated the "Concept Independence" and "Completeness of functionality" principles of Concept Design.

Here's an iteration on the `ResourceIntent` concept, removing these external dependencies and clarifying its role as an independent, modular unit of functionality.

***

### Key Changes Made:

1. **Removed Ownership Rules from `state` Constraints**: The original concept included `Ownership rule` and `Self-intent rule` as implicit invariants. These rules depend on knowing who owns a `Resource`, which is external to the `ResourceIntent` concept itself. These are now explicitly recognized as *application-level policies* to be enforced by external synchronization rules, not internal constraints of `ResourceIntent`.
2. **Removed Ownership Checks from `declareIntent` and `switchIntentType` `requires` clauses**: Similarly, the `requires` clauses for `declareIntent` and `switchIntentType` previously checked if the `user` was the owner of the `resource`. These checks have been removed. The `ResourceIntent` concept now allows *any* user to declare *any type* of intent (BORROW or LEND) or switch between them, provided the internal constraints of the `ResourceIntent` concept itself are met (e.g., uniqueness of active intent, valid parameters).
3. **Clarified `ResourceID` and `UserID` existence checks**: The `requires` for `resource` and `user` were "exists". For true independence, `ResourceIntent` cannot verify the existence of these entities in other concepts (e.g., a `Resource` concept or `User` concept). It only cares that the IDs themselves are valid *format-wise*. Actual entity existence is an external precondition usually enforced by syncs. The phrasing has been updated to reflect this.
4. **Updated Purpose and Principles**: Added notes to the concept's purpose and principles to explicitly highlight that ownership-based policies are handled externally via syncs.
5. **Added Purpose to Actions**: Added a "purpose" description for each action to clearly state its role.

***

### Revised `ResourceIntent` Concept

```markdown
# Important Background:
# Why Concept Design?
Concept design is a new approach to software development that attempts to find greater modularity in the structuring of the functionality of applications. The key idea is to break the functionality down into separable, modular services called *concepts*, each of which can be specified, implemented and understood separately -- by users and by developers.

The advantages of concept design include:

* Improved separation of concerns resulting in simpler and more robust design and implementation;
* Greater recognition of reusable behaviors, so reduced work for designers and developers and more familiar interactions for users;
* Improved focus on the purposes and motivations of the functionality, since each concept is closely targeted at delivering a particular function of value in the context of the larger app.

## What is a concept?

A concept is a reusable unit of user-facing functionality that serves a well-defined and intelligible purpose. Each concept maintains its own state, and interacts with the user (and with other concepts) through atomic actions. Some actions are performed by users; others are output actions that occur spontaneously under the control of the concept.

A concept typically involves objects of several different kinds, holding relationships between them in its state. For example, the *Upvote* concept, whose purpose is to rank items by popularity, maintains a relationship between the items and the users who have approved or disapproved of them. The state of a concept must be sufficiently rich to support the concept’s behavior; if *Upvote* lacked information about users, for example, it would not be able to prevent double voting. But the concept state should be no richer than it need be: *Upvote* would *not* include anything about a user beyond the user’s identity, since the user’s name (for example) plays no role in the concept’s behavior.

A concept will generally be implemented as a backend service, with its state made persistent using a database. The behavior of the concept is thus captured by an API specification that is similar in many respects to that of conventional backend services. At the same time, because all concepts are user facing, the behavior of a concept is also generally a human behavioral protocol. For example, the *RestaurantReservation* concept whose actions are *reserve*, *cancel*, *seat*, etc., can be viewed by a developer as a backend API with functions/endpoints corresponding to the actions, and to a human user as the pattern of behavior that one engages in for restaurant reservations: reserving, perhaps canceling, being seated on arrival, etc.

## Compared to Concepts in Conceptual Modeling

In contrast to the way the word is sometimes used in other settings, a concept is not an element in an ontology. In the field of conceptual modeling, a “conceptual model” is often a data model in which the concepts are entities. Richer kinds of conceptual model have been defined that incorporate be- havior, for example, by defining the concepts as objects (or more accurately classes) with their own internal behavior. These approaches do not allow a modular treatment of concepts, however. The behavior associated with a concept typically involves multiple classes of objects, and modifications that involve their relationships to one another. For example, the behavior of the *Upvote* concept is to associate votes with both particular items and with the users who issued the votes (in order to prevent double voting).

## Concept Reuse and Familiarity

Most concepts are reusable across applications; thus the same *Upvote* concept appears for upvoting comments in the New York Times and for upvoting answers on Stack Overflow. A concept can also be instantiated multiple times within the same application to play different roles.

This archetypal nature of concepts is essential. From the user’s perspective, it gives the familiarity that makes concepts easy to understand: a user encountering the same context in a new setting brings their understanding of that concept from their experience in previous settings.

From a designer’s perspective, it allows concepts to be repositories of design knowledge and experience. When a developer implements *Upvote*, even if they can’t reuse the code of a prior implementation, they can rely on all the discoveries and refinements previously made. Many of these are apparent in the behavior of the concept itself, but others are associated with the implementation, or are subtle enough to need explicit description. The community of designers could develop “concept catalogs” that capture all this knowledge, along with relationships between concepts (for example, that *Upvote* often relies on the *Session* concept for identifying users, which itself is associated with the *UserAuthentication* concept for authenticating users).

## Concept Independence

Perhaps the most significant distinguishing feature of concepts, in comparison to other modularity schemes, is their mutual independence. Each concept is defined without reference to any other concepts, and can be understood in isolation.

Early work on mental models established the principle that, in a robust model, the different elements must be independently understandable. The same holds in software: the reason a user can make sense of a new social media app, for example, is that each of the concepts (*Post*, *Comment*, *Upvote*, *Friend*, etc) are not only familiar but also separable, so that understanding one doesn’t require understanding another.

Concept independence lets design scale, because individual concepts can be worked on by different designers or design teams, and brought together later. Reuse requires independence too, because coupling between concepts would prevent a concept from being adopted without also including the concepts it depends on.

Polymorphism is key to independence: the designer of a concept should strive to make the concept as free as possible of any assumptions about the content and interpretation of objects passed as action arguments. Even if a *Comment* concept is used within an app only for comments on posts, it should be described as applying comments to arbitrary targets, defined only by their identity.

## Separation of concerns

One of the key advances of concept design is a more effective *separation of concerns* than is typical in software designs. This means that each concept addresses only a single, coherent aspect of the functionality of the application, and does not conflate aspects of functionality that could easily be separated.

In a traditional design, in contrast, concerns are often conflated, especially around objects (or classes). For example, it is common for a *User* class to handle all kinds of functions associated with users: authentication, profiles, naming, choice of communication channels for notification, and more. In a concept design, these would be separated into different concepts: one for authentication, one for profiles, one for naming, one for notification, and so on. The state declaration form makes it easy to associate the appropriate properties or fields with user objects in each concept. For example, the *UserAuthentication* concept may have a state that maps user identifiers to usernames and passwords; the *Profile* concept may map user identifiers to bios and thumbnail images; the *Notification* concept may map user identifiers to phone numbers and email addresses to be used as notification channels.

## Completeness of functionality

Another key distinction between concept design and traditional design is that concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts. For example, a *Notification* concept that has an action to notify a user cannot "make a call" to an action of an emailing or text messaging context to actually deliver a notification. Instead that functionality would be part of the *Notification* concept itself. It is always possible to separate out some functionality into another concept (and to sync the concepts together to achieve some combined functionality) so long as the concept that remains is still coherent and fulfills all of its functionality without dependencies.

## Composition by synchronization

Because concepts are fully independent of one another, they cannot refer to each other or use each other's services. Concepts are therefore composed using *synchronizations* (or *syncs*). A sync is a rule that says that *when* an action happens in one concept, *where* the state of some concept has some property, *then* some action happens in another concept. For example, a sync may say that *when* a post p is deleted (in the *Post* concept, through the occurrence of an action), and *where* c is a comment on the post p (in the *Comment* concept), then comment c is deleted (in the *Comment* concept). This can be written

```

sync CascadePostDeletion
when
Post.delete (p)
where
in Comment: target of c is p
then
Comment.delete (c)

```

Not that the syncs is not only causing an action to happen but also providing input arguments to actions (in this case the comment to be deleted).

A sync can have multiple actions in its when and then clauses, and can refer to the state of multiple concepts in the where clause.

Some other examples of how syncs are used:

* When a user comments on another user's post, the second user is notified
* When a user exhibits some good behavior, karma is awarded to them
* When a user checks out a shopping cart, their credit card is charged.

Syncs can be used for authentication and authorization. In these case, it is common to represent requests made by a user as actions of a kind of pseudo concept (which is usually called *Request*). For example, a sync might say that if a user requests to delete a post, and the user is the author of the post, then the deletion can go ahead:

```

sync DeletePost
when
Request.deletePost (p, s)
where
in Session: user of session s is u
in Post: author of p is u
then
Post.delete (p)

```

# ResourceIntent Concept:

# concept: ResourceIntent

**concept**: ResourceIntent [ResourceID, UserID]

*   **purpose**: Capture and manage a user’s declared intent to either borrow or lend a specific resource. This concept handles the lifecycle and details of intent records, enabling matching, filtering, and downstream workflows *independently of resource ownership or external user/resource details*.
*   **principle**:
    *   A user can declare at most one active intent per resource at a time.
    *   *Policies regarding who can declare `LEND` or `BORROW` intents (e.g., based on resource ownership, user permissions, or resource existence) are application-level concerns to be enforced externally via synchronization rules.*
    *   Intents follow a simple lifecycle (`ACTIVE`, `CANCELLED`, `FULFILLED`, `EXPIRED`) and can include optional metadata (quantity, timeframe, notes) to aid matching and enforcement.

**state**:

*   a set of `IntentEntries` with
    *   `resource` ResourceID
    *   `user` UserID
    *   `type` String in {"BORROW", "LEND"}
    *   `status` String in {"ACTIVE", "CANCELLED", "FULFILLED", "EXPIRED"}
    *   `quantity` Number (optional, > 0)
    *   `timeWindow` { `start`: Timestamp, `end`: Timestamp } (optional; if present, `start` <= `end`)
    *   `notes` String (optional, reasonable length)
    *   `createdAt` Timestamp
    *   `updatedAt` Timestamp
*   a set of `Constraints` (implicit invariants *within this concept*):
    *   Uniqueness: at most one `IntentEntry` with `status = ACTIVE` per (`resource`, `user`).
    *   Validity rule: if `timeWindow` is present, `timeWindow.start` <= `timeWindow.end`.
    *   Expired status: if an `IntentEntry` has a `timeWindow` and `timeWindow.end` is in the past, its `status` should eventually transition to `EXPIRED` (typically handled by `expireIntent` action or `clearExpiredIntents`).

**actions**:

*   `declareIntent(resource: ResourceID, user: UserID, type: "BORROW" | "LEND", quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String): Empty`

    *   **purpose**: Creates a new active intent for a user regarding a specific resource.
    *   **requires**:
        *   `resource` is a valid `ResourceID` format.
        *   `user` is a valid `UserID` format.
        *   No existing `IntentEntry` with `status = ACTIVE` for (`resource`, `user`).
        *   If `quantity` provided, it’s > 0.
        *   If `timeWindow` provided, `timeWindow.start` <= `timeWindow.end`.
    *   **effects**:
        *   Creates an `IntentEntry` with `status = ACTIVE` and provided fields; sets `createdAt`, `updatedAt`.
*   `updateIntent(resource: ResourceID, user: UserID, patch: { quantity?: Number, timeWindow?: { start: Timestamp, end: Timestamp }, notes?: String }): Empty`

    *   **purpose**: Modifies the details of an existing active intent.
    *   **requires**:
        *   An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
        *   If updating `quantity`, it’s > 0.
        *   If updating `timeWindow`, `timeWindow.start` <= `timeWindow.end`.
    *   **effects**:
        *   Updates the specified fields on the active `IntentEntry`; sets `updatedAt`.
*   `cancelIntent(resource: ResourceID, user: UserID): Empty`

    *   **purpose**: Marks an active intent as cancelled by the user or an external process.
    *   **requires**:
        *   An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    *   **effects**:
        *   Sets the intent’s `status = CANCELLED`; updates `updatedAt`.
*   `fulfillIntent(resource: ResourceID, user: UserID): Empty`

    *   **purpose**: Marks an active intent as successfully fulfilled, typically after a match or transaction.
    *   **requires**:
        *   An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
        *   *Any external preconditions for fulfillment (e.g., a successful match or transaction) must be verified by a synchronization rule prior to invoking this action.*
    *   **effects**:
        *   Sets the intent’s `status = FULFILLED`; updates `updatedAt`.
*   `expireIntent(resource: ResourceID, user: UserID, asOf: Timestamp): Empty`

    *   **purpose**: Explicitly marks an intent as expired if its time window has passed relative to a given timestamp.
    *   **requires**:
        *   An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
        *   The intent has a `timeWindow` and `timeWindow.end` is prior to `asOf`.
    *   **effects**:
        *   Sets the intent’s `status = EXPIRED`; updates `updatedAt`.
*   `switchIntentType(resource: ResourceID, user: UserID, newType: "BORROW" | "LEND"): Empty`

    *   **purpose**: Changes the type of an existing active intent (e.g., from BORROW to LEND or vice-versa).
    *   **requires**:
        *   An `IntentEntry` with `status = ACTIVE` exists for (`resource`, `user`).
    *   **effects**:
        *   Updates the intent’s `type` to `newType`; updates `updatedAt`.
        *   *(Policy note: external synchronization rules would typically govern when a user is permitted to switch intent types, possibly based on resource ownership or other factors.)*
*   `getIntent(resource: ResourceID, user: UserID): IntentEntry | Null`

    *   **purpose**: Retrieves the most recent intent entry for a given resource and user.
    *   **requires**:
        *   None (read-only).
    *   **effects**:
        *   Returns the most recent `IntentEntry` for (`resource`, `user`), if any.
*   `listResourceIntents(resource: ResourceID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`

    *   **purpose**: Lists all intents associated with a specific resource, with optional filtering.
    *   **requires**:
        *   None (read-only).
    *   **effects**:
        *   Returns all intents for `resource`, optionally filtered by `status` and/or `type`.
*   `listUserIntents(user: UserID, filter?: { status?: Set<String>, type?: Set<String> }): IntentEntry[]`

    *   **purpose**: Lists all intents declared by a specific user, with optional filtering.
    *   **requires**:
        *   None (read-only).
    *   **effects**:
        *   Returns all intents declared by `user`, optionally filtered by `status` and/or `type`.
*   `clearExpiredIntents(asOf: Timestamp): Empty`

    *   **purpose**: System-level action to transition all relevant active intents to an expired state based on their time windows, up to a specific timestamp.
    *   **requires**:
        *   None.
    *   **effects**:
        *   For every `ACTIVE` intent with a `timeWindow` where `timeWindow.end < asOf`, sets `status = EXPIRED`; updates `updatedAt`.
```

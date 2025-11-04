# LendMIT — Final Design Summary

## Executive summary

I re-designed the application from app-specific concepts into a small set of reusable, composable concepts with clear responsibilities and stable sync endpoints. Compared to Assignment 2 and the Assignment 4b visual design, the final design:

- Removes all-in-one User and Posting concepts
- Splits functionality into focused concepts (UserAuthentication, UserProfile, Resource, ResourceIntent, TimeBoundedResource, Following, NotificationLog)
- Eliminates the ResourceStatus concept in favor of time-bound availability and owner-driven deletion
- Exposes a compact, consistent request API via the Requesting concept + route syncs
- Adds operational safeguards (notification fan-out, cleanup, best-effort email) while staying resource-light

## What changed since Assignment 2

### From “big” concepts to small, reusable ones

- User → replaced with a generic ID type and two concepts:
  - UserAuthentication: credentials, verification codes, status
  - UserProfile: first/last name, bio, thumbnail
- EmailAuth → merged into UserAuthentication
  - One concept now manages verification and account states (UNVERIFIED → VERIFIED → DEACTIVATED)
- Posting → split into three concepts:
  - Resource: ownable entity with name, category, description
  - ResourceIntent: decoupled intent (LEND/BORROW)
  - TimeBoundedResource: availability windows + expiration event
- Subscriptions → split into:
  - Following: who follows whom
  - NotificationLog: log of event notifications with delivery/dismissal lifecycle

Rationale

- Narrow, composable concepts are easier to test, reuse, and extend.
- Separating identity (ID) from attributes (UserProfile) and credentials (UserAuthentication) simplifies security and evolution.
- Splitting Posting removes coupling among content, intent, and availability.

Snapshot Link: [@response.32516e63](../../context/design/concepts/refactor-concepts-prompt.md/steps/response.32516e63.md)

Snapshot Link: [@response.47c73e21](../../context/design/concepts/refactor-concepts-prompt.md/steps/response.47c73e21.md)

## What changed since Assignment 4b (visual design)

- Removed ResourceStatus entirely
  - State is inferred by TimeBoundedResource (start/end) and by owners deleting resources
- Clarified expiration as an event
  - Expire triggers downstream actions (intent clearing, deletion) rather than hard-deleting directly
- Added a simple contact flow with a new query:
  - UserAuthentication.getEmail(user) returns owner’s email; UI opens a one-click Outlook draft
- Introduced a rich, navigable notification center:
  - NotificationLog list/get endpoints return parsed content for UI rendering and deep-linking to posts
- Operational polish:
  - Email sending is best-effort and non-blocking (works even on SMTP-restricted hosts: throws an error in console log instead of sending the email)
  - Scheduled cleanup removes expired postings periodically
  - Route policy tightened and standardized on canonical endpoints:
    - Frontend removed “Concept” fallbacks and now calls only canonical routes
    - Backend enforces authorization in sync handlers (owner/follower checks)
    - Only read-only/public queries are exposed as passthrough; mutating routes go through Requesting + syncs
  - Clients automatically attach X-Auth-User; Requesting injects authUser into action inputs for backend checks

Snapshot Link: [@concept.f5236ccb](../../context/design/concepts/TimeBoundedResource/prompts/concept-prompt.md/steps/concept.f5236ccb.md)

## Final concept set and responsibilities

- UserAuthentication
  - registerUser, sendVerificationCode, verifyCode, login, getEmail, changePassword, activate/deactivate, cleanExpiredCodes
  - Enforces @mit.edu registration and normalized email
- UserProfile
  - create/get/update/delete profile fields (firstName, lastName, bio, thumbnail)
- Resource
  - create/update/delete/list resources; owner, name, category, description
- ResourceIntent
  - define/undefine intents; set/clear/get intent; list intents; list resources by intent
- TimeBoundedResource
  - defineTimeWindow, getTimeWindow, expireResource (event), deleteTimeWindow; listExpiredResources (for cleanup)
- Following
  - follow/unfollow; unique follower→followee index; idempotent behavior
- NotificationLog
  - logNotification, markAsDelivered, dismissNotification, clearDismissedNotifications
  - listNotificationsWithContent, getNotificationWithContent (parsed JSON with raw fallback)

How they fit together

- Create post: Resource.createResource → ResourceIntent.setIntent → TimeBoundedResource.defineTimeWindow (optional) → fan-out to followers (Following + NotificationLog)
- Read post: list-by-intent → get resource → lazily resolve intent/time window/owner profile
- Cleanup: periodic job lists expired resources → delete time window → clear intent → delete resource

## Synchronizations and Requesting routes

We expose a small, consistent surface via the Requesting concept and route syncs (see `src/syncs/core.sync.ts`). Highlights:

- UserAuthentication
  - /UserAuthentication/getEmail, /changePassword, /activateUser, /deactivateUser, /revokeVerification, /cleanExpiredCodes
- UserProfile
  - /UserProfile/createProfile, /getProfile, /updateProfile, /deleteProfile
- Resource
  - /Resource/createResource, /updateResource, /deleteResource
  - Read: /Resource/listResources, /Resource/listResourcesByOwner, /Resource/getResource
- ResourceIntent
  - /ResourceIntent/defineIntent, /undefineIntent, /setIntent, /clearIntent
  - /ResourceIntent/getIntent, /listIntents, /listResourcesByIntent
- TimeBoundedResource
  - /TimeBoundedResource/defineTimeWindow, /getTimeWindow, /expireResource, /deleteTimeWindow
- Following
  - /Following/follow, /unfollow
- NotificationLog
  - /NotificationLog/logNotification, /markAsDelivered, /dismissNotification, /clearDismissedNotifications
  - /NotificationLog/getNotifications, /listNotificationsWithContent, /getNotificationWithContent
- Maintenance
  - /Maintenance/cleanupExpiredResources (scheduled and manual/admin-triggered cleanup)

Authorization and routing policy

- Auth propagation

  - Clients send X-Auth-User on every request; the Requesting server copies this into the action body as authUser
  - Sync handlers use authUser to enforce server-side authorization

- Guards enforced in syncs (write/mutate paths)

  - Resource.create/update/delete: only the resource owner (owner === authUser)
  - ResourceIntent.set/clear: only the resource owner
  - TimeBoundedResource.define/expire/delete: only the resource owner
  - Following.follow/unfollow: follower must match authUser

- Error semantics

  - Missing X-Auth-User → Unauthorized
  - Resource not found → Not found
  - Owner/follower mismatch → Forbidden

- Passthrough policy (Requesting passthrough inclusions/exclusions)
  - Inclusions: safe, read-only/public routes (e.g., Resource.get/list, Resource.listByOwner, ResourceIntent.get/list/listByIntent, TimeBoundedResource.getTimeWindow, Following.isFollowing/getFollowees/getFollowers, NotificationLog list/get, and select UserAuthentication routes: registerUser, sendVerificationCode, verifyCode, login)
  - Exclusions: all mutating routes and internal/maintenance methods; these go through Requesting and syncs where authorization is enforced
  - “Unverified routes” are any concept methods not listed in inclusions; they are flagged at startup. We explicitly exclude internal admin routes like Following.initialize/ensureIndexes/migrateLegacyCollection and TimeBoundedResource.listExpiredResources

## Data model updates

- Removed ResourceStatus collection entirely
- Introduced unique compound index on Following (follower, followee)
- Namespaced collections:
  - UserAuthentication.useraccounts, UserAuthentication.verificationcodes
  - notifications (NotificationLog)
  - Resource-related collections handled by each concept
- Notification content stored as JSON string, parsed on read; rawContent field returned if parsing fails
- Added uniqueness constraints and shifted to single-document atomic updates on write paths to prevent duplicate/overlapping state

Snapshot Link: [@response.27619791](../../context/design/concepts/Resource/prompts/implementation-prompt.md/steps/response.27619791.md)

## Operational considerations

- Email transport is best-effort and non-blocking
  - If SMTP is missing, the system logs a local dev hint with the verification code (non-production)
- Cleanup and quotas
  - Scheduled cleanup deletes expired postings at a configurable interval (CLEANUP_INTERVAL_MINUTES; 0 disables)
  - Admin sync for on-demand cleanup; small DB maintenance scripts (e.g., clearing Requesting.requests)

## Snapshot references

Snapshot Link: [@response.32516e63](../../context/design/concepts/refactor-concepts-prompt.md/steps/response.32516e63.md)

Snapshot Link: [@response.47c73e21](../../context/design/concepts/refactor-concepts-prompt.md/steps/response.47c73e21.md)

Snapshot Link: [@concept.f5236ccb](../../context/design/concepts/TimeBoundedResource/prompts/concept-prompt.md/steps/concept.f5236ccb.md)

Snapshot Link: [@response.27619791](../../context/design/concepts/Resource/prompts/implementation-prompt.md/steps/response.27619791.md)

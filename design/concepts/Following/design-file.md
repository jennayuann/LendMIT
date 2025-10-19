# Following — Design Changes & Issues
## Summary of Changes
1.  **New concept introduced (refactored from original Subscription concept in Assignment 2):** The original `Subscription` concept mixed two responsibilities: managing who follows what (subscriptions) and sending notifications when relevant events occur. This was split into two modular concepts:
	- `Following`: handles relationships between entities.
	- `NotificationLog`: handles event-driven notifications.
2. **Modularized the model:** Removed `Tag` and `Event` types, leaving only generic `Follower` and `Followee` generic identifiers. So now, anything can form a follow relationship with anything else based on whatever context is needed in the user's application. 
3. **Added query actions:** Introduced `isFollowing`, `getFollowees`, and `getFollowers` for introspection without modifying state.
4. **Removed all notification-related actions:** such as `generateNotification` and `markNotificationDelivered`, which now belong to `NotificationLog`.
## Issues Encountered
1. **Already Following:** Deciding whether `follow` should fail or silently succeed when a relationship already exists. The current design keeps it strict and requires that no existing relationship exists, although either behavior is valid.
2. **Self-following rule:** The concept currently doesn't enforce that self-following isn't valid. Explicitly adding a `requires: follower ≠ followee` constraint might improve clarity, but I wanted to keep it general in case there are some applications that require that relationship. 
3. **Potential extensions:** Some optional actions (e.g., `countFollowers`, `unfollowAll`) were considered but omitted to preserve conceptual minimality.
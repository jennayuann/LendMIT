# NotificationLog — Design Changes & Issues
## Summary of Changes
1.  **New concept introduced (refactored from original Subscription concept in Assignment 2):** In Assignment 2, `Subscription` combined both following relationships and notification handling. The new `NotificationLog` isolates only the **notification-tracking** behavior, leaving the relationship management to the new `Following` concept.
2. **Generalized notification model:** Notifications are now generic event logs that can represent any alert or message, not limited to tags or postings.
3.  **Generalized recipient model:** Receivers of notifications are now generic `Recipients` and are not limited to Users as in `Postings`.
## Issues Encountered

1. **Balancing generality and structure:** Making the concept fully generic (for any event type) required removing schema-specific assumptions like `Tag` or `Event`. This improved reusability but reduced built-in validation of content structure, and the implementor of these concepts will have to do work to create the types passed in. 
2. **Clarifying system vs. user control:** Some actions (e.g., marking as delivered) could be triggered automatically by the system or manually by the user; distinguishing these layers is an implementation-level concern left outside the concept.
3. **Notification clearing:** Deciding whether “clearing” dismissed notifications should happen automatically or manually. The final design keeps the action manual to preserve user control, but this may be an issue with data size and cleanliness when notifications pile up. 
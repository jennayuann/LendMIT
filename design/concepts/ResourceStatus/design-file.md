# ResourceStatus — Design Changes & Issues
## Summary of Changes
1.  **New concept introduced (refactored from original Posting concept):** The original Posting concept tightly combined name, timing, and status management into one packed concept. One of the components I split off from that is this ResourceStatus concept, which isolates the status lifecycle logic into its own modular concept that is applicable to any resource type.
2. **Generalized Status Model:** Replaced fixed statuses: (`ACTIVE`, `FULFILLED`, `CANCELLED`, `EXPIRED`) with user-defined `StatusDefinitions`.
3. **Generalized Transition Logic:** The transition action is no longer hardcoded. The user is able to define their own transitions from one status to another.  
## Issues Encountered

1.  **Intake Types:** Deciding on whether for statuses to take in type `String` or type `StatusDefinition`. For example, making currentStatus directly reference a `StatusDefinition` may improve consistency but lose out on simplicity.
2. **Overhead Configuration:** While trying to make this concept as modular and general as I could, I noticed that this generality introduces a lot of setup work. All applications will have to define their own statuses and transitions before use. 
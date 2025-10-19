# UserProfile — Design Changes & Issues

## Summary of Changes
1.  **New concept introduced:** `UserProfile` was created by splitting the original assignment 2 `User` concept into two independent concepts: 
	- `UserAuthentication`: handles registration, login, verification.
	- `UserProfile`: manages mutable, descriptive information. 
2. **Removed credential fields:** email, password, and status fields moved to `UserAuthentication`.
3. **Added fundamental actions:** `createProfile`, `updateProfile`, `deleteProfile`, and `getProfile`.

## Issues Encountered

1.  **Boundary Definition Between Concepts:** Determining which information belonged in UserProfile versus UserAuthentication was not always clear. I had to seek a lot of guidance from LLMs and think through it deeply.
2. **Potential Over-Fragmentation**: While modularity improves reusability, splitting concepts introduce extra overhead coordination work (e.g., syncing creation and deletion of `UserProfile` entries with user registration or deactivation), so I had to work through deciding a good balance between the two. 
3. **Extent of UserProfile Concept:** User profiles are often used in many contexts, each with different needs. So I intentionally kept `UserProfile` generic and minimal, but in real applications, they often include many more features. So, I had to find a good balance of conceptual simplicity with likely future extensions. 
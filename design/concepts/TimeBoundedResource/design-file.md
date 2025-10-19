# TimeBoundedResource — Design Changes & Issues
## Summary of Changes
1.  **New concept introduced (refactored from original Posting concept):** The original `Posting` concept combined ownership, content, time window, and status logic. `TimeBoundedResource` extracts only the time management aspect, making it reusable for any resource that has a period of availability.
2. **Clarified Expiration Mechanism:** Clarified `expireResource` as an "event notification" rather than a state-mutating action, ensuring synchronization with other concepts (like `ResourceStatus`) while preserving independence. 
## Issues Encountered
- **Worries about synchronizations:** In the Assignment 2 `Posting` concept, time availability was tightly coupled to posting attributes and lifecycle statuses. Splitting all those concepts up makes me feel unsure about what synchronizations to use and how complex it will be. 
- **Optional availableFrom and availableUntil:** Having these two parameters be optional complicates the logic, especially the code later, to make sure that all possible subsets of optional cases are considered. 
- **Edge cases in availability boundaries:** Allowing null bounds introduces potential ambiguity and conflicts around "current time" interpretation. So, it's extra important to ensure consistent handling of time and especially the "current time".
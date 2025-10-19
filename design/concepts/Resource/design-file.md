# Resource — Design Changes & Issues
## Summary of Changes
1.  **New concept introduced (refactored from original Posting concept):** In assignment 2 originally, I had a Posting concept that represents a time-bounded intention of a user to either lend or borrow. That is now decomposed into smaller, modular components. The `Resource` concept now represents the core data structure of `Posting`, a generic and own-able entity with descriptive attributes. The other logic from `Posting` is refactored into other independent concepts, namely `ResourceStatus` and `TimeBoundedResource`. Now, since this is a concept for general Resources, it can support many domains, such as postings, items, documents, etc. without having to rewrite core logic. 

## Issues Encountered

1.  **Determining Scope of Generalization:** Deciding which fields belonged in Resource versus the other components broken from the original Posting concept. I didn't want to over clutter one of the components so that it loses it's modularity like Posting did. 
2. **Trade-off Between Simplicity and Practicality:** A fully generic Resource concept is simple and clean but will require additional efforts later on to capture application-specific meaning, such as the lending and borrowing logic. 
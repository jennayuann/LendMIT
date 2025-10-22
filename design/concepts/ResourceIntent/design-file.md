Concept that was added later on after realizing that my refactoring of concepts into more modular left out the concept on intent that would allow users to categorize their post as either a borrowing or lending post.
# ResourceIntent — Design Changes & Issues
## Summary of Changes
1.  **New concept introduced (refactored from original Posting concept):** This concept was added after the other refactored concepts after realizing that my refactored concepts from the original Posting concept left out the functionality of tagging posts with an intent; in my application, it is tagging them as lending or borrowing.

## Issues Encountered
1. Deciding whether or not this is in itself a stand-alone concept or whether it should be coupled into the `Resource` concept—and how to make it generic enough that it doesn't seem like it should just be added into another concept.  
2. Not realizing that my concepts lacked the intent functionality which is pretty integral to my application. 
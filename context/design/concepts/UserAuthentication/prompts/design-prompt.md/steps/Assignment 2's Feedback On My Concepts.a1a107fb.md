---
timestamp: 'Thu Oct 16 2025 15:07:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_150745.2b16ae77.md]]'
content_id: a1a107fbe45de3a0df9dabbdbad72088843fbea3189af5f2419da3525d688f26
---

# Assignment 2's Feedback On My Concepts:

Note: User is a generic type and extremely standard, so in the future no need to define it unless there is really special functionality for your app. Typically email auth is also not its own concept (remember the token nexample from the psets?).\
Actions:\
-4: You have a lot of functionality roped into both the posting and subscribing concepts such that they are not reusable. We want to maintain modularity and separation of concerns such that each concept handles only a very small and specific set of info and actions, and such that some other app or even the same app could reuse the concept in many ways. For example for the URL shortening app we have UrlShortening that only stores the long and short URLs, NonceGeneration that only generates nonces, and ExpiringResource that only handles expiring. Similarly, you should keep Posting extremely generic. It should be reusable such that Facebook for example could use the same concept. Then, you could separate out expiring to its own concept for when people no longer need the item or when an item is no longer available to be borrowed, using a sync to expire the post. Similarly your subscription concept is more like two separate concepts: following and notifying.

## Current UserAuthentication Concept:

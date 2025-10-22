## Overview 
In Assignment 2, concepts like `User`, `EmailAuth`, `Posting`, and `Subscriptions` were not modular and dealt with multiple responsibilities. This time, I redesigned the application around smaller, modular concepts that are more general and reusable.

_(Design changes for individual concepts are explained in detail in a file named "design-file" in their respective folders: design/concepts/CONCEPT_NAME/design-file)._

## Original Concepts (Assignment 2)
### **User**
Handled _everything_ about a user—registration, passwords, verification status, and descriptive attributes like names and emails—all inside one concept. It also defined the type `User`, even though that type could simply exist as a generic identifier shared across concepts.

### **EmailAuth**
Focused only on email verification: generating and checking verification codes, managing expiry times, and updating flags. However, it duplicated authentication logic that really belonged with user management.

### **Posting**
Combined multiple concerns—ownership, content (name, category, description), lifecycle status, and time-based availability—into a single concept. It wasn’t general enough to be reused beyond the “lending/borrowing” context and was hard to test or extend.

### **Subscriptions**
Mixed two unrelated ideas: (1) who follows or subscribes to what, and (2) sending notifications when events occurred. That made the concept unclear and too broad in scope.

## Changes
### **User → removed, replaced by generic type, and complemented by UserProfile**
Based on TA feedback, `User` didn’t need to be its own concept.  
The identity of a user can be represented by a generic type parameter (`User`) shared across other concepts like `UserAuthentication` and `UserProfile`. This keeps identity flexible and avoids maintaining redundant state for something that only needs to serve as an ID. 

To handle descriptive information that used to live in the old `User` concept, I introduced a new concept called **UserProfile**.
- **UserProfile** — manages a user’s visible, editable attributes separately from authentication.
It allows users to update their profile details safely without affecting credentials or verification logic. This separation allows the application to divide secure data (in `UserAuthentication`) from general display data (in `UserProfile`).
### **EmailAuth → merged into UserAuthentication**
In the TA’s feedback and in Problem Set 1's example, we saw that authentication concepts can include verification tokens as part of the same model (like `PasswordAuthentication` with email confirmation).  
Following that model, I merged `EmailAuth` into UserAuthentication.  
This unifies registration, password handling, and verification under one concept, instead of treating verification as a separate concern.  
The result is a simpler flow where the same concept manages users’ credentials, their verification codes, and their status transitions (`UNVERIFIED → VERIFIED → DEACTIVATED`).
- **UserAuthentication** — manages user credentials, verification codes, and lifecycle states.

### **Posting → split into Resource, ResourceIntent, ResourceStatus, and TimeBoundedResource**
The old `Posting` concept was the biggest issue—it handled too much at once: user ownership, intent, descriptive data, timing, and lifecycle rules.  
It wasn’t general enough to apply outside the lending/borrowing scenario. I decomposed it into three separate, reusable concepts:

- **Resource** — represents any ownable entity with name, category, and description.

- **ResourceIntent** — captures what the intent of a resource is.
    
- **ResourceStatus** — manages lifecycle transitions between states.
    
- **TimeBoundedResource** — defines availability periods and expiration windows.
    
By doing this, I made each concern modular and reusable for any application. Now, these same concepts can describe listings, documents, items, or other resource types without redefinition.

### **Subscriptions → split into Following and NotificationLog**
`Subscriptions` tried to handle both relationship management and notifications.  
To simplify it, I split it into two clear, minimal concepts:

- **Following** — tracks who follows whom (follower → followee).
    
- **NotificationLog** — handles event logging, delivery, and dismissal for any type of notification.
    

This design is cleaner and more general: you can now follow users, resources, or categories, and generate notifications from any concept when something changes.

## How the concepts fit together now

- **UserAuthentication + UserProfile** manage who someone is and how they appear.
    
- **Resource**, **ResourceIntent**, **ResourceStatus**, and **TimeBoundedResource** describe what they create, its intent, its state, and its availability.
    
- **Following** connects users to one another.
    
- **NotificationLog** keeps track of updates and events that followers care about.
    

Each concept works on its own but can synchronize through IDs or event triggers when needed (for example, when a resource expires or a user deactivates).

## Interesting Moments:
### 1. Splitting the Posting Concept
Snapshot Link: [@response.32516e63](../../context/design/concepts/refactor-concepts-prompt.md/steps/response.32516e63.md)

When I started refactoring `Posting` after the TA’s feedback for Assignment 2, I realized it was handling way too many responsibilities at once, but I wasn’t sure how to split it without losing the original concept's meaning. It was surprisingly hard to design modular concepts once I already had a specific application in mind, since that made my thinking too narrow. After feeding all my context into this LLM, its response on how to refactor into `Resource`, `ResourceStatus`, and `TimeBoundedResource` was super clear and cohesive. Typically, when I work with ChatGPT or some other LLM, it's difficult and tiresome to feed it a lot of context, so I usually don't, but I was super surprised at how easy it is to feed this Context tool a lot of context.  

### 2. User
Snapshot Link: [@response.47c73e21](../../context/design/concepts/refactor-concepts-prompt.md/steps/response.47c73e21.md)

At first, I tried to keep `User` as a full concept because that felt the most intuitive to me; in my mind, every user should have a name, email, password, etc., so it made most sense to have a concept to store all that. But after feeding all my original concepts into the LLM, I realized `User` is better treated as an identity, not a data container. Therefore, `User` itself should just be a generic type, and two new concepts were introduced: `UserProfile` for personal data and `UserAuthentication` for credentials and verification.

### 3. Clarifying Expiration as an Event
Snapshot Link: [@concept.f5236ccb](../../context/design/concepts/TimeBoundedResource/prompts/concept-prompt.md/steps/concept.f5236ccb.md)

In `TimeBoundedResource`, I originally tried to make `expireResource` delete entries, but that caused issues with synchronization—especially when the corresponding `ResourceStatus` still needed to update its state afterward. The LLM prompting me to redefine it as a “pure event” that triggers other concept actions instead was one of the most important conceptual shifts I made for this concept.

### 4. Reliability and accuracy of LLM
Snapshot Link: [@response.39fbed54](../../context/design/concepts/ResourceStatus/prompts/test-prompt.md/steps/response.39fbed54.md)

I had been using the LLM to generate test suites for each concept, and most of them were surprisingly accurate and runnable with minimal edits. But one time, when I used the same prompt for `ResourceStatus`, the output was full of errors that made the code completely not runnable. I reran the exact same prompt and context, and the second response was much better. This inconsistency was very interesting to see because it was only this one response that was so off compared to the others even though I was using the same template to prompt the LLM.

### 5. Discovering race conditions
Snapshot Link: [@response.27619791](../../context/design/concepts/Resource/prompts/implementation-prompt.md/steps/response.27619791.md)

While testing concurrent updates in the `Resource` concept, I discovered a race condition in `updateResource`. Two updates running close together could overwrite each other or lead to inconsistent data. Debugging it reminded me of concurrency problems from 6.1020, which was really cool. I prompted the LLM to fix it, and it did it well.
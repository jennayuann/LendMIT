---
timestamp: 'Thu Oct 16 2025 03:55:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_035528.472425f1.md]]'
content_id: 1a817a72804bf6d6952c2a2993840b7b793711e39843a768285b7dfd5e19ea31
---

# Assignment 2's Feedback On My Concepts:

Note: User is a generic type and extremely standard, so in the future no need to define it unless there is really special functionality for your app. Typically email auth is also not its own concept (remember the token nexample from the psets?).\
Actions:\
-4: You have a lot of functionality roped into both the posting and subscribing concepts such that they are not reusable. We want to maintain modularity and separation of concerns such that each concept handles only a very small and specific set of info and actions, and such that some other app or even the same app could reuse the concept in many ways. For example for the URL shortening app we have UrlShortening that only stores the long and short URLs, NonceGeneration that only generates nonces, and ExpiringResource that only handles expiring. Similarly, you should keep Posting extremely generic. It should be reusable such that Facebook for example could use the same concept. Then, you could separate out expiring to its own concept for when people no longer need the item or when an item is no longer available to be borrowed, using a sync to expire the post. Similarly your subscription concept is more like two separate concepts: following and notifying.

## Current Concepts

### User

```
concept User

purpose: provides an identity for each participant in the system so that actions can be tied to real people.

principle: a user begins by registering with their email, name, and password; the user goes into a PENDING status until they verify their email, after which they become a REGISTERED user; users can later deactivate their accounts.

  

state

a set of Users with

an email String

a firstName String

a lastName String

a password String

a status of PENDING OR REGISTERED or DEACTIVATED

  

actions

registerUser(email: String, password: String, firstName: String, lastName: String)

requires: no existing User with this email

effect: a new User is created with the given email, password, firstName, lastName, and status = PENDING

  

changePassword(user: User, newPassword: String)

requires: given user's status is REGISTERED

effect: user's password becomes newPassword

  

activateUser(user: User)

requires: given user's status is PENDING

effect: user's status becomes REGISTERED

  

deactivateUser(user: User)

requires: given user's status is REGISTERED

effect: user's status becomes DEACTIVATED

  

Note: in our case, an MIT email is needed to verify that they're a student.

```

### EmailAuth

```
concept EmailAuth[User, Time]

purpose: verifies ownership of an email address.

principle: the system generates a verification code and delivers it to the email address provided; the person must present that code before the verification expires in order to prove ownership.

  

state

a set of EmailAuth with

a user User

a code String

an expiry Time

a verified Flag

  

actions

sendVerificationCode(user: User)

effects: a new EmailAuth is created for user with a fresh code, expiry in the future, and verified = FALSE

  

verifyCode(user: User, code: String)

requries: an EmailAuth exists for user whose code matches and whose expiry is in the future

effect: that EmailAuth becomes verified = TRUE

  

revokeVerification(user: User)

requries: an EmailAuth exists for user

effect: that EmailAuth record is removed

```

### Posting

```
concept Posting[User, Time]

purpose: represents a time-bounded intention of a user to either lend or borrow.

principle: a user creates a posting with a name, description, category, role (borrower or lender), and time window. The posting is initially active; the user may later update the posting or delete it. If a counterpart is found, the posting is marked as fulfilled; if the time window passes without fulfillment, the posting becomes expired.

  

state

a set of Postings with

an owner User

a role of BORROWER or LENDER

a name String

a category String

an optional description String

an optional availableFrom Time // if not given, availableFrom = current time

an optional availableUntil Time // if not given, availableUntil = indefinite

a status of ACTIVE or FULFILLED or CANCELLED or EXPIRED

  

actions

createPosting(owner: User,

role: BORROWER or LENDER,

name: String,

category: String,

description: String?,

availableFrom: Time?,

availableUntil: Time?)

requires: availableFrom and availableUntil if given forms a valid time window

effect: a new Posting is created with the given attributes; if availableFrom is not given, set it to current time; if availableUntil is not given, set it to indefinite; status is set to ACTIVE

  

updatePosting(posting: Posting,

newName: String?,

newCategory: String?,

newDescription: String?,

newAvailableFrom: Time?,

newAvailableUntil: Time?)

requires: given posting's status to be ACTIVE; if provided, the new time window must be valid; at least one of the optional attributes must be given.

effect: posting is updated with any of the attributes that are given: newName, newCategory, newDescription, newAvailableFrom, and newAvailableUntil

  

cancelPosting(posting: Posting)

requires: posting's status to be ACTIVE

effect: posting's status becomes CANCELLED

  

fulfillPosting(posting: Posting)

requires: posting's status to be ACTIVE

effect: posting's status becomes FULFILLED

  

expirePosting(posting: Posting)

requires: posting's status to be ACTIVE and current time is after posting's availableUntil

effect: posting's status becomes EXPIRED

  

deletePosting(posting: Posting)

requires: posting's status to be CANCELLED, FULFILLED, OR EXPIRED

effect: posting is removed from the set of Postings

```

### Subscriptions

```
concept Subscriptions[User, Tag, Event]

purpose: allows a user to express interest in a certain category (tag) so they can be notified when relevant events occur.

principle: a user subscribes to a tag (or to multiple) that represents a category of interest; the user can later unsubscribe. Whenever an event occurs that is associated with a tag matching the subscription, the system creates a notification for that user.

  

state

a set of Subscriptions with

a subscriber User

a tag Tag

  

a set of Notifications with

a recipient User

an event Event

a delivered Flag

  

actions

subscribe(subscriber: User, tag: Tag)

requires: user exists and is valid

effect: a new Subscription is created linking the subscriber to that tag

  

unsubscribe(subscriber: User, tag: Tag)

requires: a Subscription exists for subscriber and given tag is in that user's tags

effect: that tag is removed from tags

  

generateNotification(event: Event)

requires: given event is valid

effect: for each Subscription whose tag matches the tag of event, a new Notification is created for that subscriber with delivered = FALSE

  

markNotificationDelivered(notification: Notification)

requries: notification's delivered is FALSE

effect: notification's delivered becomes TRUE

  

clearNotifications(notification: Notification)

requires: notification's delivered is TRUE

effect: notification is removed from set of Notifications

  

removeAllSubscriptions(subscriber: User)

requires: given subscriber exists in Subscriptions

effect: all Subscriptions with given subscriber are removed

  

removeAllNotifications(recipient: User)

requires: given recipient exists in Notifications

effect: all Notifications with given recipient are removed

  

Note:

- The generic type Events would be Postings in our scenario.

- In generateNotifications, a valid event would be one that has a category and is active in our scenario.

- A tag corresponds to a category in Postings.

```

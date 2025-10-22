---
timestamp: 'Tue Oct 21 2025 13:58:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_135808.97ea082d.md]]'
content_id: 925296e78a24321eb396f6a733dfd514feeebd493c3853f73658428b3af3da9a
---

# concept: ResourceIntent

concept: ResourceIntent \[ResourceID]

* purpose: Associate any resource with a single, application-defined intent label drawn from a configurable vocabulary. This is purely declarative; no lifecycle, timing, ownership, or matching logic is implied.
* principle:
  * Intent is a simple label on a resource.
  * The set of valid intent labels is defined within this concept.
  * At most one intent label per resource at a time.
  * This concept does not depend on or write to other concepts.

state:

* a set of IntentDefinitions with
  * intentName String
* a set of IntentEntries with
  * resource ResourceID
  * intent String // must reference an existing IntentDefinition

actions:

* defineIntent(intentName: String): Empty

  * requires:
    * no IntentDefinition exists with intentName
  * effects:
    * adds intentName to IntentDefinitions
* undefineIntent(intentName: String): Empty

  * requires:
    * an IntentDefinition exists with intentName
    * no IntentEntry currently uses intentName
  * effects:
    * removes intentName from IntentDefinitions
* setIntent(resource: ResourceID, intent: String): Empty

  * requires:
    * intent is defined in IntentDefinitions
  * effects:
    * creates or replaces the IntentEntry for resource with the given intent
* clearIntent(resource: ResourceID): Empty

  * requires:
    * an IntentEntry exists for resource
  * effects:
    * removes the IntentEntry for resource
* getIntent(resource: ResourceID): { resource: ResourceID, intent: String } | Null

  * requires:
    * true (read-only)
  * effects:
    * returns the current IntentEntry for resource, or null if none
* listIntents(): String\[]

  * requires:
    * true (read-only)
  * effects:
    * returns all defined intent names
* listResourcesByIntent(intent: String): ResourceID\[]

  * requires:
    * intent is defined in IntentDefinitions
  * effects:
    * returns all resources whose IntentEntry has the given intent

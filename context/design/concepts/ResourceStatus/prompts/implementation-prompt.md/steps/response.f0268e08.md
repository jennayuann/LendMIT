---
timestamp: 'Sat Oct 18 2025 23:35:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_233547.ceb051ab.md]]'
content_id: f0268e08ddff62dfe371d73961669eed173f7ec211cea0d09fd53909b45c42d2
---

# response:

```typescript
// src/concepts/ResourceStatus.ts

import { Collection, Db } from "npm:mongodb";
import { db } from "@/db/connection.ts";
import { ID, Empty } from "@/utils/types.ts";
import { freshID } from "@/utils/database.ts";

// Declare collection prefix, use concept name
const CONCEPT_PREFIX = "ResourceStatus.";

/**
 * ResourceID is a generic identifier for any resource type.
 */
type ResourceID = ID;

/**
 * Represents a status definition.
 * The `_id` is the unique status name.
 *
 * Corresponds to "a set of `StatusDefinitions` with `statusName` String"
 */
interface StatusDefinition {
  _id: string; // The statusName itself
}

/**
 * Represents a status entry for a specific resource.
 * The `_id` is the `ResourceID`.
 *
 * Corresponds to "a set of `StatusEntries` with `resource` ResourceID, `currentStatus` String"
 */
interface StatusEntry {
  _id: ResourceID; // The resource ID itself
  currentStatus: string;
}

/**
 * Represents a valid transition rule between two statuses.
 * The `_id` is a generated unique identifier for the rule document.
 *
 * Corresponds to "a set of `TransitionRules` with `fromStatus` String, `toStatus` String"
 */
interface TransitionRule {
  _id: ID; // Generated ID for the rule itself
  fromStatus: string;
  toStatus: string;
}

/**
 * Implements the ResourceStatus concept.
 *
 * Purpose: Provide a generic and configurable mechanism to manage and track the lifecycle status of any resource type,
 * enforcing application-defined transition rules between states.
 *
 * Principle: A resource can be marked with any defined status, and its current status can be updated
 * only according to predefined, consistent transition rules. The concept allows the definition of
 * custom status labels and the valid transitions between them.
 */
class ResourceStatus {
  private statusDefinitions: Collection<StatusDefinition>;
  private statusEntries: Collection<StatusEntry>;
  private transitionRules: Collection<TransitionRule>;

  constructor(private readonly db: Db) {
    this.statusDefinitions = this.db.collection(CONCEPT_PREFIX + "statusDefinitions");
    this.statusEntries = this.db.collection(CONCEPT_PREFIX + "statusEntries");
    this.transitionRules = this.db.collection(CONCEPT_PREFIX + "transitionRules");

    // Ensure unique index for transition rules to enforce uniqueness of (fromStatus, toStatus) pair.
    this.transitionRules.createIndex(
      { fromStatus: 1, toStatus: 1 },
      { unique: true, background: true }
    ).catch((err) => console.error("Failed to create unique index for transitionRules:", err));
  }

  /**
   * Defines a new status that can be used for resources.
   *
   * @param {Object} params - The parameters for defining a status.
   * @param {string} params.statusName - The unique name of the status to define.
   * @returns {Promise<Empty>} An empty object on successful definition.
   * @throws {Error} If a `StatusDefinition` for `params.statusName` already exists.
   *
   * @action defineStatus
   * @requires A `StatusDefinition` for `statusName` does not exist.
   * @effects Adds `statusName` to the set of `StatusDefinitions`.
   */
  async defineStatus({ statusName }: { statusName: string }): Promise<Empty> {
    // Requires: A `StatusDefinition` for `statusName` does not exist.
    const existingDefinition = await this.statusDefinitions.findOne({ _id: statusName });
    if (existingDefinition) {
      throw new Error(`StatusDefinition '${statusName}' already exists.`);
    }

    // Effects: Adds `statusName` to the set of `StatusDefinitions`.
    await this.statusDefinitions.insertOne({ _id: statusName });
    return {};
  }

  /**
   * Defines a valid transition rule between two statuses.
   *
   * @param {Object} params - The parameters for defining a transition.
   * @param {string} params.fromStatus - The starting status.
   * @param {string} params.toStatus - The target status.
   * @returns {Promise<Empty>} An empty object on successful definition.
   * @throws {Error} If `params.fromStatus` or `params.toStatus` are not defined, or if the transition rule already exists.
   *
   * @action defineTransition
   * @requires A `StatusDefinition` for `fromStatus` exists.
   * @requires A `StatusDefinition` for `toStatus` exists.
   * @requires A `TransitionRule` from `fromStatus` to `toStatus` does not already exist.
   * @effects Adds a `TransitionRule` (from `fromStatus`, to `toStatus`) to the set of `TransitionRules`.
   */
  async defineTransition({ fromStatus, toStatus }: { fromStatus: string; toStatus: string }): Promise<Empty> {
    // Requires: A `StatusDefinition` for `fromStatus` exists.
    const fromStatusDef = await this.statusDefinitions.findOne({ _id: fromStatus });
    if (!fromStatusDef) {
      throw new Error(`'fromStatus' definition '${fromStatus}' does not exist.`);
    }

    // Requires: A `StatusDefinition` for `toStatus` exists.
    const toStatusDef = await this.statusDefinitions.findOne({ _id: toStatus });
    if (!toStatusDef) {
      throw new Error(`'toStatus' definition '${toStatus}' does not exist.`);
    }

    // Requires: A `TransitionRule` from `fromStatus` to `toStatus` does not already exist.
    // The unique index handles this implicitly for insert, but an explicit check provides a clearer error message.
    const existingRule = await this.transitionRules.findOne({ fromStatus, toStatus });
    if (existingRule) {
      throw new Error(`Transition rule from '${fromStatus}' to '${toStatus}' already exists.`);
    }

    // Effects: Adds a `TransitionRule` (from `fromStatus`, to `toStatus`) to the set of `TransitionRules`.
    await this.transitionRules.insertOne({
      _id: freshID(), // Generate a unique ID for the rule document
      fromStatus,
      toStatus,
    });
    return {};
  }

  /**
   * Creates a new status entry for a resource with an initial status.
   *
   * @param {Object} params - The parameters for creating a status entry.
   * @param {ResourceID} params.resource - The ID of the resource.
   * @param {string} params.initialStatus - The initial status for the resource.
   * @returns {Promise<Empty>} An empty object on successful creation.
   * @throws {Error} If a `StatusEntry` for `params.resource` already exists, or if `params.initialStatus` is not defined.
   *
   * @action createEntry
   * @requires A `StatusEntry` for `resource` does not exist.
   * @requires A `StatusDefinition` for `initialStatus` exists.
   * @effects Creates a new `StatusEntry` for `resource` and sets its `currentStatus` to `initialStatus`.
   */
  async createEntry({ resource, initialStatus }: { resource: ResourceID; initialStatus: string }): Promise<Empty> {
    // Requires: A `StatusEntry` for `resource` does not exist.
    const existingEntry = await this.statusEntries.findOne({ _id: resource });
    if (existingEntry) {
      throw new Error(`StatusEntry for resource '${resource}' already exists.`);
    }

    // Requires: A `StatusDefinition` for `initialStatus` exists.
    const initialStatusDef = await this.statusDefinitions.findOne({ _id: initialStatus });
    if (!initialStatusDef) {
      throw new Error(`'initialStatus' definition '${initialStatus}' does not exist.`);
    }

    // Effects: Creates a new `StatusEntry` for `resource` and sets its `currentStatus` to `initialStatus`.
    await this.statusEntries.insertOne({
      _id: resource,
      currentStatus: initialStatus,
    });
    return {};
  }

  /**
   * Transitions a resource's status to a new target status.
   *
   * @param {Object} params - The parameters for transitioning a status.
   * @param {ResourceID} params.resource - The ID of the resource.
   * @param {string} params.targetStatus - The status to transition to.
   * @returns {Promise<Empty>} An empty object on successful transition.
   * @throws {Error} If a `StatusEntry` for `params.resource` does not exist, `params.targetStatus` is not defined,
   * or a valid `TransitionRule` from the current status to the target status does not exist.
   *
   * @action transition
   * @requires A `StatusEntry` for `resource` exists.
   * @requires A `StatusDefinition` for `targetStatus` exists.
   * @requires A `TransitionRule` from `currentStatus` to `targetStatus` exists.
   * @effects Updates the `currentStatus` of `resource` to `targetStatus`.
   */
  async transition({ resource, targetStatus }: { resource: ResourceID; targetStatus: string }): Promise<Empty> {
    // Requires: A `StatusEntry` for `resource` exists.
    const entry = await this.statusEntries.findOne({ _id: resource });
    if (!entry) {
      throw new Error(`StatusEntry for resource '${resource}' does not exist.`);
    }

    const currentStatus = entry.currentStatus;

    // Requires: A `StatusDefinition` for `targetStatus` exists.
    const targetStatusDef = await this.statusDefinitions.findOne({ _id: targetStatus });
    if (!targetStatusDef) {
      throw new Error(`'targetStatus' definition '${targetStatus}' does not exist.`);
    }

    // Requires: A `TransitionRule` from `currentStatus` to `targetStatus` exists.
    const transitionRule = await this.transitionRules.findOne({
      fromStatus: currentStatus,
      toStatus: targetStatus,
    });
    if (!transitionRule) {
      throw new Error(`No transition rule defined from '${currentStatus}' to '${targetStatus}'.`);
    }

    // Effects: Updates the `currentStatus` of `resource` to `targetStatus`.
    await this.statusEntries.updateOne(
      { _id: resource },
      { $set: { currentStatus: targetStatus } },
    );
    return {};
  }
}

// Export the instantiated class
export const resourceStatus = new ResourceStatus(db);
```

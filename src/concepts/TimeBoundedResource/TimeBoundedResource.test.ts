// src/concepts/TimeBoundedResource.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertMatch, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { TimeBoundedResource } from "./TimeBoundedResource.ts";
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const resourceA = "resourceA" as ID;
const resourceB = "resourceB" as ID;
const resourceC = "resourceC" as ID;
const nonExistentResource = "nonExistentResource" as ID;
const emptyResourceID = "" as ID; // Edge case for empty string ID

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR TIME BOUNDED RESOURCE CONCEPT");
console.log("===========================================\n");

// Helper function to get current time plus/minus milliseconds
const addMs = (date: Date, ms: number) => new Date(date.getTime() + ms);

// Helper function to create a date in the past
const createPastDate = (offsetMs: number) => new Date(Date.now() - offsetMs);

// Helper function to create a date in the future
const createFutureDate = (offsetMs: number) => new Date(Date.now() + offsetMs);

// Define a common collection type for clarity, matching the internal TimeWindow interface
interface TimeWindowDoc {
  _id: ID;
  resource: ID;
  availableFrom: Date | null;
  availableUntil: Date | null;
}

// ----------------------------------------------------------------------
// DEFINE TIME WINDOW ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DEFINE TIME WINDOW ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection(
      "timeBoundedResources",
    );
    await coll.deleteMany({}); // Ensure clean state for this test block

    await t.step(
      "✅ Happy path: Define window with both availableFrom and availableUntil",
      async () => {
        const availableFrom = createPastDate(10000); // 10 seconds ago
        const availableUntil = createFutureDate(10000); // 10 seconds from now

        await timeBoundedResource.defineTimeWindow({
          resource: resourceA,
          availableFrom,
          availableUntil,
        });

        const storedWindow = await coll.findOne({ _id: resourceA });
        assertEquals(storedWindow?.resource, resourceA);
        assertEquals(
          storedWindow?.availableFrom?.getTime(),
          availableFrom.getTime(),
        );
        assertEquals(
          storedWindow?.availableUntil?.getTime(),
          availableUntil.getTime(),
        );

        const retrievedWindow = await timeBoundedResource.getTimeWindow({
          resource: resourceA,
        });
        assertEquals(
          retrievedWindow?.availableFrom?.getTime(),
          availableFrom.getTime(),
        );
        assertEquals(
          retrievedWindow?.availableUntil?.getTime(),
          availableUntil.getTime(),
        );
      },
    );

    await t.step(
      "✅ Happy path: Define window with null availableFrom (should default to now)",
      async () => {
        const availableUntil = createFutureDate(10000);
        const startTime = new Date(); // Capture approximate start time

        await timeBoundedResource.defineTimeWindow({
          resource: resourceB,
          availableFrom: null,
          availableUntil,
        });

        const storedWindow = await coll.findOne({ _id: resourceB });
        // Ensure non-null before accessing
        if (!storedWindow || !storedWindow.availableFrom) {
          throw new Error(
            "Expected stored window with availableFrom for resourceB",
          );
        }
        assertEquals(storedWindow.resource, resourceB);
        // availableFrom should be close to startTime
        assertEquals(storedWindow.availableFrom instanceof Date, true);
        const fromTimeB = storedWindow.availableFrom.getTime();
        assertEquals(fromTimeB >= startTime.getTime() - 1000, true); // Allow 1 sec variance
        assertEquals(fromTimeB <= new Date().getTime() + 1000, true); // Allow 1 sec variance
        assertEquals(
          storedWindow.availableUntil?.getTime(),
          availableUntil.getTime(),
        );
      },
    );

    await t.step(
      "✅ Happy path: Define window with null availableUntil (should be indefinite)",
      async () => {
        const availableFrom = createPastDate(5000);

        await timeBoundedResource.defineTimeWindow({
          resource: resourceC,
          availableFrom,
          availableUntil: null,
        });

        const storedWindow = await coll.findOne({ _id: resourceC });
        assertEquals(storedWindow?.resource, resourceC);
        assertEquals(
          storedWindow?.availableFrom?.getTime(),
          availableFrom.getTime(),
        );
        assertEquals(storedWindow?.availableUntil, null);
      },
    );

    await t.step(
      "✅ Happy path: Define window with both availableFrom and availableUntil as null",
      async () => {
        const startTime = new Date(); // Capture approximate start time
        await timeBoundedResource.defineTimeWindow({
          resource: "resourceD" as ID,
          availableFrom: null,
          availableUntil: null,
        });

        const storedWindow = await coll.findOne({ _id: "resourceD" as ID });
        if (!storedWindow || !storedWindow.availableFrom) {
          throw new Error(
            "Expected stored window with availableFrom for resourceD",
          );
        }
        assertEquals(storedWindow.resource, "resourceD" as ID);
        assertEquals(storedWindow.availableFrom instanceof Date, true);
        const fromTimeD = storedWindow.availableFrom.getTime();
        assertEquals(fromTimeD >= startTime.getTime() - 1000, true); // Allow 1 sec variance
        assertEquals(fromTimeD <= new Date().getTime() + 1000, true); // Allow 1 sec variance
        assertEquals(storedWindow.availableUntil, null);
      },
    );

    await t.step(
      "✅ Requires violation: availableFrom is equal to availableUntil",
      async () => {
        const commonTime = new Date();
        await assertRejects(
          () =>
            timeBoundedResource.defineTimeWindow({
              resource: resourceA,
              availableFrom: commonTime,
              availableUntil: commonTime,
            }),
          Error,
          "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
        );
      },
    );

    await t.step(
      "✅ Requires violation: availableFrom is after availableUntil",
      async () => {
        const availableFrom = createFutureDate(10000);
        const availableUntil = createPastDate(10000);
        await assertRejects(
          () =>
            timeBoundedResource.defineTimeWindow({
              resource: resourceA,
              availableFrom,
              availableUntil,
            }),
          Error,
          "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
        );
      },
    );

    await t.step("✅ Edge case: Updating an existing time window", async () => {
      const originalFrom = createPastDate(20000);
      const originalUntil = createFutureDate(20000);
      await timeBoundedResource.defineTimeWindow({
        resource: resourceA,
        availableFrom: originalFrom,
        availableUntil: originalUntil,
      });

      const newFrom = createPastDate(5000);
      const newUntil = createFutureDate(5000);
      await timeBoundedResource.defineTimeWindow({
        resource: resourceA,
        availableFrom: newFrom,
        availableUntil: newUntil,
      });

      const storedWindow = await coll.findOne({ _id: resourceA });
      assertEquals(storedWindow?.availableFrom?.getTime(), newFrom.getTime());
      assertEquals(storedWindow?.availableUntil?.getTime(), newUntil.getTime());
    });

    await t.step(
      "✅ Edge case: Defining a window with empty string ID",
      async () => {
        const availableFrom = createPastDate(1000);
        const availableUntil = createFutureDate(1000);
        await timeBoundedResource.defineTimeWindow({
          resource: emptyResourceID,
          availableFrom,
          availableUntil,
        });

        const storedWindow = await coll.findOne({ _id: emptyResourceID });
        assertEquals(storedWindow?.resource, emptyResourceID);
        assertEquals(
          storedWindow?.availableFrom?.getTime(),
          availableFrom.getTime(),
        );
        assertEquals(
          storedWindow?.availableUntil?.getTime(),
          availableUntil.getTime(),
        );
      },
    );

    await client.close();
    console.log("✅ Finished DEFINE TIME WINDOW tests\n");
  },
});

// ----------------------------------------------------------------------
// GET TIME WINDOW ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Unit tests for 'getTimeWindow' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: GET TIME WINDOW ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection(
      "timeBoundedResources",
    );
    await coll.deleteMany({}); // Ensure clean state for this test block

    const availableFrom = createPastDate(10000);
    const availableUntil = createFutureDate(10000);
    await timeBoundedResource.defineTimeWindow({
      resource: resourceA,
      availableFrom,
      availableUntil,
    });
    await timeBoundedResource.defineTimeWindow({
      resource: resourceB,
      availableFrom: null,
      availableUntil: null,
    }); // default to now, indefinite

    await t.step(
      "✅ Happy path: Retrieve an existing time window (full dates)",
      async () => {
        const window = await timeBoundedResource.getTimeWindow({
          resource: resourceA,
        });
        assertEquals(window?.resource, resourceA);
        assertEquals(window?.availableFrom?.getTime(), availableFrom.getTime());
        assertEquals(
          window?.availableUntil?.getTime(),
          availableUntil.getTime(),
        );
      },
    );

    await t.step(
      "✅ Happy path: Retrieve an existing time window (null dates)",
      async () => {
        const window = await timeBoundedResource.getTimeWindow({
          resource: resourceB,
        });
        assertEquals(window?.resource, resourceB);
        assertEquals(window?.availableFrom instanceof Date, true); // Should have defaulted to now
        assertEquals(window?.availableUntil, null); // Should be null
      },
    );

    await t.step(
      "✅ Negative path: Retrieve a non-existent time window",
      async () => {
        const window = await timeBoundedResource.getTimeWindow({
          resource: nonExistentResource,
        });
        assertEquals(window, null);
      },
    );

    await t.step(
      "✅ Edge case: Retrieve window for empty string ID",
      async () => {
        const emptyIDAvailableFrom = createPastDate(5000);
        const emptyIDAvailableUntil = createFutureDate(5000);
        await timeBoundedResource.defineTimeWindow({
          resource: emptyResourceID,
          availableFrom: emptyIDAvailableFrom,
          availableUntil: emptyIDAvailableUntil,
        });

        const window = await timeBoundedResource.getTimeWindow({
          resource: emptyResourceID,
        });
        assertEquals(window?.resource, emptyResourceID);
        assertEquals(
          window?.availableFrom?.getTime(),
          emptyIDAvailableFrom.getTime(),
        );
        assertEquals(
          window?.availableUntil?.getTime(),
          emptyIDAvailableUntil.getTime(),
        );
      },
    );

    await client.close();
    console.log("✅ Finished GET TIME WINDOW tests\n");
  },
});

// ----------------------------------------------------------------------
// EXPIRE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Unit tests for 'expireResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: EXPIRE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection(
      "timeBoundedResources",
    );
    await coll.deleteMany({}); // Ensure clean state for this test block

    // Setup a resource that is already expired
    const expiredFrom = createPastDate(20000);
    const expiredUntil = createPastDate(10000);
    await timeBoundedResource.defineTimeWindow({
      resource: resourceA,
      availableFrom: expiredFrom,
      availableUntil: expiredUntil,
    });

    await t.step(
      "✅ Happy path: Expire an already expired resource",
      async () => {
        await timeBoundedResource.expireResource({ resource: resourceA });
        // The action should complete without error
        const storedWindow = await coll.findOne({ _id: resourceA });
        assertEquals(
          storedWindow?.availableFrom?.getTime(),
          expiredFrom.getTime(),
        );
        assertEquals(
          storedWindow?.availableUntil?.getTime(),
          expiredUntil.getTime(),
        );
      },
    );

    await t.step(
      "✅ Happy path: Expire resource exactly at availableUntil time",
      async () => {
        const now = new Date();
        await timeBoundedResource.defineTimeWindow({
          resource: resourceB,
          availableFrom: addMs(now, -1000),
          availableUntil: now,
        });
        await timeBoundedResource.expireResource({ resource: resourceB });
        // Should pass without error
      },
    );

    await t.step(
      "✅ Requires violation: No TimeWindow entry found",
      async () => {
        await assertRejects(
          () =>
            timeBoundedResource.expireResource({
              resource: nonExistentResource,
            }),
          Error,
          `Validation Error: No TimeWindow entry found for resource '${nonExistentResource}'.`,
        );
      },
    );

    await t.step(
      "✅ Requires violation: availableUntil is null (indefinite)",
      async () => {
        await timeBoundedResource.defineTimeWindow({
          resource: resourceC,
          availableFrom: createPastDate(1000),
          availableUntil: null,
        });
        await assertRejects(
          () => timeBoundedResource.expireResource({ resource: resourceC }),
          Error,
          `Validation Error: 'availableUntil' is not defined (null) for resource '${resourceC}'. Cannot expire an indefinitely available resource through this action.`,
        );
      },
    );

    await t.step(
      "✅ Requires violation: Current time is earlier than availableUntil",
      async () => {
        const futureUntil = createFutureDate(10000);
        await timeBoundedResource.defineTimeWindow({
          resource: "resourceD" as ID,
          availableFrom: createPastDate(1000),
          availableUntil: futureUntil,
        });
        const errD = await assertRejects(
          () =>
            timeBoundedResource.expireResource({ resource: "resourceD" as ID }),
          Error,
        );
        assertMatch(
          String((errD as Error).message),
          new RegExp(
            `Current time \\(.+\\) is earlier than 'availableUntil' \\(${futureUntil.toISOString()}\\) for resource 'resourceD'`,
          ),
        );
      },
    );

    await t.step(
      "✅ Edge case: Expiring with empty string ID (if window exists)",
      async () => {
        const expiredFromEmpty = createPastDate(20000);
        const expiredUntilEmpty = createPastDate(10000);
        await timeBoundedResource.defineTimeWindow({
          resource: emptyResourceID,
          availableFrom: expiredFromEmpty,
          availableUntil: expiredUntilEmpty,
        });

        await timeBoundedResource.expireResource({ resource: emptyResourceID });
        // Should pass without error
      },
    );

    await t.step(
      "✅ State verification: expireResource does not modify the stored window",
      async () => {
        const originalFrom = createPastDate(20000);
        const originalUntil = createPastDate(10000);
        await timeBoundedResource.defineTimeWindow({
          resource: "resourceE" as ID,
          availableFrom: originalFrom,
          availableUntil: originalUntil,
        });

        const beforeExpiration = await coll.findOne({ _id: "resourceE" as ID });
        await timeBoundedResource.expireResource({
          resource: "resourceE" as ID,
        });
        const afterExpiration = await coll.findOne({ _id: "resourceE" as ID });

        assertEquals(
          beforeExpiration?.availableFrom?.getTime(),
          afterExpiration?.availableFrom?.getTime(),
        );
        assertEquals(
          beforeExpiration?.availableUntil?.getTime(),
          afterExpiration?.availableUntil?.getTime(),
        );
      },
    );

    await client.close();
    console.log("✅ Finished EXPIRE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// DELETE TIME WINDOW ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Unit tests for 'deleteTimeWindow' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DELETE TIME WINDOW ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection(
      "timeBoundedResources",
    );
    await coll.deleteMany({}); // Ensure clean state for this test block

    await t.step("✅ Happy path: Delete an existing time window", async () => {
      await timeBoundedResource.defineTimeWindow({
        resource: resourceA,
        availableFrom: null,
        availableUntil: null,
      });

      const before = await timeBoundedResource.getTimeWindow({
        resource: resourceA,
      });
      assertEquals(before?.resource, resourceA);

      await timeBoundedResource.deleteTimeWindow({ resource: resourceA });

      const after = await timeBoundedResource.getTimeWindow({
        resource: resourceA,
      });
      assertEquals(after, null);
    });

    await t.step(
      "✅ Negative path: Delete non-existent time window",
      async () => {
        await assertRejects(
          () =>
            timeBoundedResource.deleteTimeWindow({
              resource: nonExistentResource,
            }),
          Error,
          "not found",
        );
      },
    );

    await client.close();
    console.log("✅ Finished DELETE TIME WINDOW tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection(
      "timeBoundedResources",
    );
    await coll.deleteMany({}); // Ensure clean state for this test block

    const testResource = "traceResource" as ID;
    const past = new Date(Date.now() - 60000); // 1 minute ago
    const future = new Date(Date.now() + 60000); // 1 minute from now
    // Track last updated values for assertions across steps without time drift
    let lastUpdatedFrom: Date | null = null;
    let lastUpdatedUntil: Date | null = null;

    await t.step(
      "1. Initially, no time window exists for the resource",
      async () => {
        const initialWindow = await timeBoundedResource.getTimeWindow({
          resource: testResource,
        });
        assertEquals(initialWindow, null);
      },
    );

    await t.step(
      "2. Define a time window for the resource with future expiration",
      async () => {
        await timeBoundedResource.defineTimeWindow({
          resource: testResource,
          availableFrom: past,
          availableUntil: future,
        });
        const definedWindow = await timeBoundedResource.getTimeWindow({
          resource: testResource,
        });
        assertEquals(definedWindow?.resource, testResource);
        assertEquals(definedWindow?.availableFrom?.getTime(), past.getTime());
        assertEquals(
          definedWindow?.availableUntil?.getTime(),
          future.getTime(),
        );
      },
    );

    await t.step(
      "3. Attempt to expire the resource before its availableUntil time (should fail)",
      async () => {
        const errTrace = await assertRejects(
          () => timeBoundedResource.expireResource({ resource: testResource }),
          Error,
        );
        assertMatch(
          String((errTrace as Error).message),
          new RegExp(
            `Current time \\(.+\\) is earlier than 'availableUntil' \\(${future.toISOString()}\\) for resource '${testResource}'`,
          ),
        );
        // Verify state hasn't changed
        const windowAfterFailedExpire = await timeBoundedResource.getTimeWindow(
          { resource: testResource },
        );
        assertEquals(
          windowAfterFailedExpire?.availableFrom?.getTime(),
          past.getTime(),
        );
        assertEquals(
          windowAfterFailedExpire?.availableUntil?.getTime(),
          future.getTime(),
        );
      },
    );

    await t.step(
      "4. Update the time window to an already expired state",
      async () => {
        const newPast = new Date(Date.now() - 120000); // 2 minutes ago
        const newExpiredUntil = new Date(Date.now() - 30000); // 30 seconds ago
        await timeBoundedResource.defineTimeWindow({
          resource: testResource,
          availableFrom: newPast,
          availableUntil: newExpiredUntil,
        });
        const updatedWindow = await timeBoundedResource.getTimeWindow({
          resource: testResource,
        });
        assertEquals(
          updatedWindow?.availableFrom?.getTime(),
          newPast.getTime(),
        );
        assertEquals(
          updatedWindow?.availableUntil?.getTime(),
          newExpiredUntil.getTime(),
        );
        // Persist for later step verification
        lastUpdatedFrom = newPast;
        lastUpdatedUntil = newExpiredUntil;
      },
    );

    await t.step(
      "5. Now, successfully expire the resource (as it's past its new availableUntil)",
      async () => {
        await timeBoundedResource.expireResource({ resource: testResource });
        // No error expected
        // Verify state still unchanged after successful expire (as per concept)
        const windowAfterSuccessfulExpire = await timeBoundedResource
          .getTimeWindow({ resource: testResource });
        const newPast = lastUpdatedFrom!;
        const newExpiredUntil = lastUpdatedUntil!;
        assertEquals(
          windowAfterSuccessfulExpire?.availableFrom?.getTime(),
          newPast.getTime(),
        );
        assertEquals(
          windowAfterSuccessfulExpire?.availableUntil?.getTime(),
          newExpiredUntil.getTime(),
        );
      },
    );

    await t.step(
      "6. Define a window with indefinite availability and try to expire (should fail)",
      async () => {
        await timeBoundedResource.defineTimeWindow({
          resource: testResource,
          availableFrom: past,
          availableUntil: null,
        });
        const indefiniteWindow = await timeBoundedResource.getTimeWindow({
          resource: testResource,
        });
        assertEquals(
          indefiniteWindow?.availableFrom?.getTime(),
          past.getTime(),
        );
        assertEquals(indefiniteWindow?.availableUntil, null);

        await assertRejects(
          () => timeBoundedResource.expireResource({ resource: testResource }),
          Error,
          `Validation Error: 'availableUntil' is not defined (null) for resource '${testResource}'. Cannot expire an indefinitely available resource through this action.`,
        );
      },
    );

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Robustness tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection(
      "timeBoundedResources",
    );
    await coll.deleteMany({}); // Ensure clean state for this test block

    await t.step(
      "✅ Robustness: Concurrent 'defineTimeWindow' calls for the same resource",
      async () => {
        const now = new Date();
        const availableFrom1 = addMs(now, -1000);
        const availableUntil1 = addMs(now, 10000); // 10s from now

        const availableFrom2 = addMs(now, -2000);
        const availableUntil2 = addMs(now, 20000); // 20s from now

        const resource = "concurrentResource" as ID;

        // Both calls will attempt to define/update the same resource.
        // Due to upsert:true, only one document will exist, its state determined by the last successful write.
        // This test specifically checks that it doesn't error out, but converges to a single state.
        await Promise.allSettled([
          timeBoundedResource.defineTimeWindow({
            resource,
            availableFrom: availableFrom1,
            availableUntil: availableUntil1,
          }),
          timeBoundedResource.defineTimeWindow({
            resource,
            availableFrom: availableFrom2,
            availableUntil: availableUntil2,
          }),
          timeBoundedResource.defineTimeWindow({
            resource,
            availableFrom: availableFrom1,
            availableUntil: availableUntil1,
          }), // Another identical one
        ]);

        const count = await coll.countDocuments({ _id: resource });
        assertEquals(
          count,
          1,
          "Should only have one document for the resource due to upsert",
        );

        const storedWindow = await coll.findOne({ _id: resource });
        // The final state will be one of the provided definitions, depending on execution order.
        assertEquals(storedWindow?.resource, resource);
        // Check that it's one of the valid states (either the first or second set of dates)
        const isState1 =
          storedWindow?.availableFrom?.getTime() === availableFrom1.getTime() &&
          storedWindow?.availableUntil?.getTime() === availableUntil1.getTime();
        const isState2 =
          storedWindow?.availableFrom?.getTime() === availableFrom2.getTime() &&
          storedWindow?.availableUntil?.getTime() === availableUntil2.getTime();
        assertEquals(
          isState1 || isState2,
          true,
          "Final state should match one of the concurrent updates",
        );
      },
    );

    await t.step(
      "✅ Robustness: Sequence of define -> expire (fail) -> define -> expire (success)",
      async () => {
        const resource = "sequentialResource" as ID;
        const now = new Date();
        const future1 = addMs(now, 5000); // 5 seconds from now
        const past = addMs(now, -5000); // 5 seconds ago

        // 1. Define with future expiration
        await timeBoundedResource.defineTimeWindow({
          resource,
          availableFrom: past,
          availableUntil: future1,
        });
        let window = await timeBoundedResource.getTimeWindow({ resource });
        assertEquals(window?.availableUntil?.getTime(), future1.getTime());

        // 2. Attempt to expire (should fail)
        const errSeq = await assertRejects(
          () => timeBoundedResource.expireResource({ resource }),
          Error,
        );
        assertMatch(
          String((errSeq as Error).message),
          new RegExp(
            `Current time \\(.+\\) is earlier than 'availableUntil' \\(${future1.toISOString()}\\) for resource '${resource}'`,
          ),
        );
        window = await timeBoundedResource.getTimeWindow({ resource }); // State should be unchanged
        assertEquals(window?.availableUntil?.getTime(), future1.getTime());

        // 3. Define again with an expiration in the past (effectively expired)
        const expiredPast = addMs(now, -100); // Very recent past
        await timeBoundedResource.defineTimeWindow({
          resource,
          availableFrom: past,
          availableUntil: expiredPast,
        });
        window = await timeBoundedResource.getTimeWindow({ resource });
        assertEquals(window?.availableUntil?.getTime(), expiredPast.getTime());

        // 4. Attempt to expire (should succeed)
        await timeBoundedResource.expireResource({ resource });
        // No error expected
        window = await timeBoundedResource.getTimeWindow({ resource }); // State should still be unchanged (expiredPast)
        assertEquals(window?.availableUntil?.getTime(), expiredPast.getTime());
      },
    );

    await client.close();
    console.log("✅ Finished ROBUSTNESS tests\n");
  },
});

// ----------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------
Deno.test({
  name: "✅ Final summary",
  fn() {
    console.log(
      "\n================================================================================",
    );
    console.log(
      "🎉 TIME BOUNDED RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉",
    );
    console.log(
      "================================================================================\n",
    );
  },
});

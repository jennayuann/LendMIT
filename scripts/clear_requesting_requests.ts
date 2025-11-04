import { db } from "../src/db/connection.ts";

async function main() {
  const collName = "Requesting.requests";
  const coll = db.collection(collName);

  const before = await coll.countDocuments();
  console.log(`[clear] ${collName} count before: ${before}`);

  const res = await coll.deleteMany({});
  console.log(
    `[clear] deleteMany({}) acknowledged=${res.acknowledged} deletedCount=${res.deletedCount}`
  );

  const after = await coll.countDocuments();
  console.log(`[clear] ${collName} count after: ${after}`);
}

main().catch((err) => {
  console.error("[clear] Error:", err);
  Deno.exit(1);
});

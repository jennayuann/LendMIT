import { db } from "../src/db/connection.ts";

async function main() {
  console.log(
    "Connected DB object present. Listing collections and a sample from UserAuthentication.useraccounts:\n",
  );
  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map((c) => c.name));

  const collName = "UserAuthentication.useraccounts";
  const coll = db.collection(collName as string);
  const count = await coll.countDocuments();
  console.log(`\nCollection ${collName} count: ${count}`);

  const sample = await coll.findOne({});
  console.log(`\nSample document from ${collName}:`, sample);

  // Close client if exposed (mongodb node driver doesn't expose client via db directly)
}

main().catch((err) => {
  console.error("Inspect script error:", err);
  Deno.exit(1);
});

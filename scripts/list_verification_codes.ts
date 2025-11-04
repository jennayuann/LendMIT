import { db } from "../src/db/connection.ts";

async function main() {
  const coll = db.collection("UserAuthentication.verificationcodes");
  const count = await coll.countDocuments();
  console.log(`Verification codes count: ${count}`);
  const docs = await coll.find({}).sort({ _id: -1 }).limit(10).toArray();
  for (const d of docs) {
    console.log(d);
  }
}

main().catch((err) => {
  console.error(err);
  Deno.exit(1);
});

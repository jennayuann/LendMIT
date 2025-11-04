import { db } from "../src/db/connection.ts";

const userId = Deno.args[0];
if (!userId) {
  console.error("Usage: deno run -A scripts/find_user_by_id.ts <user-id>");
  Deno.exit(1);
}

const coll = db.collection("UserAuthentication.useraccounts");
const doc = await coll.findOne({ _id: userId as unknown as object });
console.log(doc ?? "No user found");

import { db } from "../src/db/connection.ts";

// Usage:
//   deno run -A scripts/get_verification_code.ts <user-id>
// or
//   deno run -A scripts/get_verification_code.ts --email <email>

async function main() {
  const args = [...Deno.args];
  let user: string | undefined;
  let email: string | undefined;

  // Simple arg parsing
  const emailIdx = args.indexOf("--email");
  if (emailIdx >= 0) {
    email = args[emailIdx + 1];
    args.splice(emailIdx, 2);
  }
  if (args[0]) user = args[0];

  if (!user && !email) {
    console.error("Provide a user id or --email <email>");
    Deno.exit(1);
  }

  let userId = user;
  if (!userId && email) {
    const acct = await db
      .collection("UserAuthentication.useraccounts")
      .findOne({ email });
    if (!acct) {
      console.error("No useraccount found for email:", email);
      Deno.exit(2);
    }
    userId = String(acct._id);
  }

  const codes = await db
    .collection("UserAuthentication.verificationcodes")
    .find({ user: userId })
    .sort({ expiry: -1 })
    .limit(3)
    .toArray();

  if (codes.length === 0) {
    console.log("No verification codes found for user:", userId);
    return;
  }

  console.log("Latest verification codes (most recent first):\n");
  for (const c of codes) {
    console.log({ user: c.user, code: c.code, expiry: c.expiry });
  }
}

main().catch((err) => {
  console.error("Error fetching verification code:", err);
  Deno.exit(1);
});

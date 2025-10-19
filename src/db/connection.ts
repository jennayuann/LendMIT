// src/db/connection.ts
// deno-lint-ignore no-import-prefix
import { MongoClient } from "npm:mongodb";
// deno-lint-ignore no-import-prefix
import "jsr:@std/dotenv/load";

const MONGODB_URL = Deno.env.get("MONGODB_URL");
const DB_NAME = Deno.env.get("DB_NAME");

if (!MONGODB_URL || !DB_NAME) {
  throw new Error("Missing MONGODB_URL or DB_NAME in environment variables");
}

const client = new MongoClient(MONGODB_URL);

// Connect once and export the database
await client.connect();  // ✅ Establish connection once
console.log(`✅ Connected to MongoDB database: ${DB_NAME}`);

export const db = client.db(DB_NAME);

import type { Db } from "mongodb";
import { UserProfile } from "./UserProfile.ts";

export default class UserProfileConcept extends UserProfile {
  constructor(_db: Db) {
    super();
  }
}

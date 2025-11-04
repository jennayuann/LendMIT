import { Frames, actions, Sync } from "@engine";
import type { ID } from "@utils/types.ts";
import {
  Requesting,
  UserAuthentication,
  UserProfile,
  Resource,
  ResourceIntent,
  TimeBoundedResource,
  Following,
  NotificationLog,
} from "@concepts";
import { fanOutCategoryPost } from "./notifications.ts";

interface HandlerContext {
  requestId: string;
  body: Record<string, unknown>;
}

type HandlerResult = Record<string, unknown> | void;
type RouteHandler = (ctx: HandlerContext) => Promise<HandlerResult>;

const createRouteSync =
  (path: string, handler: RouteHandler): Sync =>
  ({ request, input }) => ({
    when: actions([Requesting.request, { path }, { request, input }]),
    where: async (frames) => {
      const next = new Frames();
      for (const frame of frames) {
        const requestIdRaw = frame[request];
        const payloadRaw = frame[input];
        const requestId =
          typeof requestIdRaw === "string" ? requestIdRaw : undefined;
        const body = isRecord(payloadRaw) ? payloadRaw : {};

        if (!requestId) {
          console.error(`Missing request identifier while handling ${path}.`);
          continue;
        }

        const payload = { ...body };
        delete payload.path;

        const requestKey = requestId as unknown as ID;

        try {
          const result = await handler({ requestId, body: payload });
          const responsePayload = isRecord(result) ? result : {};
          await Requesting.respond({ request: requestKey, ...responsePayload });
        } catch (error) {
          await Requesting.respond({
            request: requestKey,
            error: toErrorMessage(error),
          });
        }
      }
      return next;
    },
    then: [],
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "Unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}

const own = Object.prototype.hasOwnProperty;

function hasKey(body: Record<string, unknown>, key: string): boolean {
  return own.call(body, key);
}

function pickString(
  body: Record<string, unknown>,
  keys: string[],
  { trim = true }: { trim?: boolean } = {}
): string | undefined {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string") {
      const str = trim ? value.trim() : value;
      if (str.length > 0 || !trim) return str;
    } else if (typeof value === "number" || typeof value === "bigint") {
      const str = String(value);
      const processed = trim ? str.trim() : str;
      if (processed.length > 0 || !trim) return processed;
    }
  }
  return undefined;
}

function requireString(
  body: Record<string, unknown>,
  keys: string[],
  fieldName: string,
  options?: { trim?: boolean }
): string {
  const value = pickString(body, keys, options);
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }
  return value;
}

function pickNullableString(
  body: Record<string, unknown>,
  keys: string[],
  { trim = true }: { trim?: boolean } = {}
): string | null | undefined {
  for (const key of keys) {
    if (!hasKey(body, key)) continue;
    const value = body[key];
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (typeof value === "string") {
      return trim ? value.trim() : value;
    }
    if (typeof value === "number" || typeof value === "bigint") {
      const str = String(value);
      return trim ? str.trim() : str;
    }
  }
  return undefined;
}

function pickBoolean(
  body: Record<string, unknown>,
  keys: string[]
): boolean | undefined {
  for (const key of keys) {
    if (!hasKey(body, key)) continue;
    const value = body[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    if (value === null) return undefined;
  }
  return undefined;
}

function parseDateField(
  body: Record<string, unknown>,
  keys: string[],
  fieldName: string
): Date | null | undefined {
  for (const key of keys) {
    if (!hasKey(body, key)) continue;
    const value = body[key];
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new Error(`Invalid ${fieldName} value.`);
      }
      return value;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "bigint"
    ) {
      const parsed = new Date(value as string | number);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid ${fieldName} value.`);
      }
      return parsed;
    }
    throw new Error(`Invalid ${fieldName} value.`);
  }
  return undefined;
}

function requireId(
  body: Record<string, unknown>,
  keys: string[],
  fieldName: string
): ID {
  return requireString(body, keys, fieldName) as unknown as ID;
}

function pickAuthUser(body: Record<string, unknown>): string | undefined {
  const raw = body["authUser"];
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return undefined;
}

async function assertOwner(body: Record<string, unknown>, resourceID: ID) {
  const authUser = pickAuthUser(body);
  if (!authUser) throw new Error("Unauthorized: missing auth user.");
  const res = await Resource.getResource({ resourceID });
  if (!res) {
    throw new Error("Not found: resource does not exist.");
  }
  const owner = res?.owner as unknown as string | undefined;
  if (!owner || String(owner) !== authUser) {
    throw new Error("Forbidden: not the resource owner.");
  }
}

export const UserAuthenticationGetEmail: Sync = createRouteSync(
  "/UserAuthentication/getEmail",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    return await UserAuthentication.getEmail({ user });
  }
);

export const UserAuthenticationChangePassword: Sync = createRouteSync(
  "/UserAuthentication/changePassword",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    const newPassword = requireString(
      body,
      ["newPassword", "password", "new_password"],
      "newPassword"
    );
    await UserAuthentication.changePassword({ user, newPassword });
    return {};
  }
);

export const UserAuthenticationActivateUser: Sync = createRouteSync(
  "/UserAuthentication/activateUser",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    await UserAuthentication.activateUser({ user });
    return {};
  }
);

export const UserAuthenticationDeactivateUser: Sync = createRouteSync(
  "/UserAuthentication/deactivateUser",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    await UserAuthentication.deactivateUser({ user });
    return {};
  }
);

export const UserAuthenticationRevokeVerification: Sync = createRouteSync(
  "/UserAuthentication/revokeVerification",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    await UserAuthentication.revokeVerification({ user });
    return {};
  }
);

export const UserAuthenticationCleanExpiredCodes: Sync = createRouteSync(
  "/UserAuthentication/cleanExpiredCodes",
  async () => {
    await UserAuthentication.cleanExpiredCodes();
    return {};
  }
);

export const UserProfileCreateProfile: Sync = createRouteSync(
  "/UserProfile/createProfile",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    const firstName = requireString(
      body,
      ["firstName", "givenName"],
      "firstName"
    );
    const lastName = requireString(
      body,
      ["lastName", "familyName"],
      "lastName"
    );
    const bio = pickNullableString(body, ["bio"]);
    const thumbnail = pickNullableString(body, ["thumbnail", "avatar"]);
    await UserProfile.createProfile({
      user,
      firstName,
      lastName,
      bio: bio ?? null,
      thumbnail: thumbnail ?? null,
    });
    return {};
  }
);

export const UserProfileGetProfile: Sync = createRouteSync(
  "/UserProfile/getProfile",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    const profile = await UserProfile.getProfile({ user });
    return profile ? { profile } : {};
  }
);

export const UserProfileConceptGetProfile: Sync = createRouteSync(
  "/UserProfileConcept/getProfile",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    const profile = await UserProfile.getProfile({ user });
    return profile ? { profile } : {};
  }
);

export const UserProfileUpdateProfile: Sync = createRouteSync(
  "/UserProfile/updateProfile",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    const update: {
      user: ID;
      firstName?: string | null;
      lastName?: string | null;
      bio?: string | null;
      thumbnail?: string | null;
    } = { user };

    if (hasKey(body, "firstName")) {
      update.firstName = pickNullableString(body, ["firstName", "givenName"]);
    }
    if (hasKey(body, "lastName")) {
      update.lastName = pickNullableString(body, ["lastName", "familyName"]);
    }
    if (hasKey(body, "bio")) {
      update.bio = pickNullableString(body, ["bio"]);
    }
    if (hasKey(body, "thumbnail") || hasKey(body, "avatar")) {
      update.thumbnail = pickNullableString(body, ["thumbnail", "avatar"]);
    }

    await UserProfile.updateProfile(update);
    return {};
  }
);

export const UserProfileDeleteProfile: Sync = createRouteSync(
  "/UserProfile/deleteProfile",
  async ({ body }) => {
    const user = requireId(body, ["user", "userId", "id"], "user");
    await UserProfile.deleteProfile({ user });
    return {};
  }
);

export const ResourceCreateResource: Sync = createRouteSync(
  "/Resource/createResource",
  async ({ body }) => {
    console.log(
      `[Sync] /Resource/createResource payload: ${JSON.stringify(
        body,
        null,
        2
      )}`
    );
    const owner = requireId(body, ["owner", "ownerId", "user"], "owner");
    {
      const authUser = pickAuthUser(body);
      if (!authUser || String(owner) !== authUser) {
        throw new Error("Forbidden: owner must match authenticated user.");
      }
    }
    const name = requireString(body, ["name", "title"], "name");
    const category = pickNullableString(body, ["category"]);
    const description = pickNullableString(body, ["description", "details"]);
    const categoryArg =
      category === undefined || category === null ? undefined : category;
    const descriptionArg =
      description === undefined || description === null
        ? undefined
        : description;
    const resourceID = await Resource.createResource({
      owner,
      name,
      category: categoryArg,
      description: descriptionArg,
    });
    console.log(
      `[Sync] /Resource/createResource created -> resourceID=${String(
        resourceID
      )}`
    );
    // Fan out notifications to followers of the category (if present)
    try {
      const { attempted, notified } = await fanOutCategoryPost(
        {
          owner,
          category: categoryArg ?? null,
          resourceID,
          name,
          description: descriptionArg ?? null,
        },
        { following: Following, notificationLog: NotificationLog }
      );
      if (attempted > 0) {
        console.log(
          `[Sync] Notifications fan-out: attempted=${attempted} notified=${notified} for category='${
            categoryArg ?? ""
          }'`
        );
      }
    } catch (err) {
      console.warn(
        `[Sync] Notifications fan-out failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
    return { resourceID };
  }
);

export const ResourceUpdateResource: Sync = createRouteSync(
  "/Resource/updateResource",
  async ({ body }) => {
    const resourceID = requireId(
      body,
      ["resourceID", "resourceId", "resource", "id"],
      "resourceID"
    );
    await assertOwner(body, resourceID);
    const name = pickString(body, ["name", "title"]);
    let category = pickNullableString(body, ["category"]);
    let description = pickNullableString(body, ["description", "details"]);

    if (category === undefined && hasKey(body, "category")) {
      category = null;
    }
    if (description === undefined && hasKey(body, "description")) {
      description = null;
    }

    await Resource.updateResource({
      resourceID,
      ...(name !== undefined ? { name } : {}),
      ...(hasKey(body, "category") ? { category } : {}),
      ...(hasKey(body, "description") ? { description } : {}),
    });
    return {};
  }
);

export const ResourceDeleteResource: Sync = createRouteSync(
  "/Resource/deleteResource",
  async ({ body }) => {
    const resourceID = requireId(
      body,
      ["resourceID", "resourceId", "resource", "id"],
      "resourceID"
    );
    await assertOwner(body, resourceID);
    await Resource.deleteResource({ resourceID });
    return {};
  }
);

export const ResourceConceptGetResource: Sync = createRouteSync(
  "/ResourceConcept/getResource",
  async ({ body }) => {
    const resourceID = requireId(
      body,
      ["resourceID", "resourceId", "resource", "id"],
      "resourceID"
    );
    const resource = await Resource.getResource({ resourceID });
    return { resource };
  }
);

export const ResourceConceptListResources: Sync = createRouteSync(
  "/ResourceConcept/listResources",
  async () => {
    const result = await Resource.listResources();
    return result;
  }
);

export const ResourceIntentDefineIntent: Sync = createRouteSync(
  "/ResourceIntent/defineIntent",
  async ({ body }) => {
    const intentName = requireString(
      body,
      ["intentName", "intent", "name"],
      "intentName"
    );
    await ResourceIntent.defineIntent({ intentName });
    return {};
  }
);

export const ResourceIntentUndefineIntent: Sync = createRouteSync(
  "/ResourceIntent/undefineIntent",
  async ({ body }) => {
    const intentName = requireString(
      body,
      ["intentName", "intent", "name"],
      "intentName"
    );
    await ResourceIntent.undefineIntent({ intentName });
    return {};
  }
);

export const ResourceIntentSetIntent: Sync = createRouteSync(
  "/ResourceIntent/setIntent",
  async ({ body }) => {
    const resource = requireId(
      body,
      ["resource", "resourceID", "resourceId", "id"],
      "resource"
    );
    await assertOwner(body, resource);
    const intent = requireString(
      body,
      ["intent", "intentName", "name"],
      "intent"
    );
    await ResourceIntent.setIntent({ resource, intent });
    return {};
  }
);

export const ResourceIntentClearIntent: Sync = createRouteSync(
  "/ResourceIntent/clearIntent",
  async ({ body }) => {
    const resource = requireId(
      body,
      ["resource", "resourceID", "resourceId", "id"],
      "resource"
    );
    await assertOwner(body, resource);
    await ResourceIntent.clearIntent({ resource });
    return {};
  }
);

export const ResourceIntentConceptGetIntent: Sync = createRouteSync(
  "/ResourceIntentConcept/getIntent",
  async ({ body }) => {
    const resource = requireId(
      body,
      ["resource", "resourceID", "resourceId", "id"],
      "resource"
    );
    const intent = await ResourceIntent.getIntent({ resource });
    return intent ?? {};
  }
);

export const ResourceIntentConceptListResourcesByIntent: Sync = createRouteSync(
  "/ResourceIntentConcept/listResourcesByIntent",
  async ({ body }) => {
    const intent = requireString(
      body,
      ["intent", "intentName", "name"],
      "intent"
    );
    const resourceIDs = await ResourceIntent.listResourcesByIntent({ intent });
    return { resourceIDs };
  }
);

export const ResourceIntentConceptListIntents: Sync = createRouteSync(
  "/ResourceIntentConcept/listIntents",
  async () => {
    const intentNames = await ResourceIntent.listIntents();
    return { intentNames };
  }
);

export const ResourceIntentConceptDefineIntent: Sync = createRouteSync(
  "/ResourceIntentConcept/defineIntent",
  async ({ body }) => {
    const intentName = requireString(
      body,
      ["intentName", "intent", "name"],
      "intentName"
    );
    await ResourceIntent.defineIntent({ intentName });
    return {};
  }
);

export const ResourceIntentListResourcesByIntent: Sync = createRouteSync(
  "/ResourceIntent/listResourcesByIntent",
  async ({ body }) => {
    const intent = requireString(
      body,
      ["intent", "intentName", "name"],
      "intent"
    );
    const resourceIDs = await ResourceIntent.listResourcesByIntent({ intent });
    return { resourceIDs };
  }
);

export const TimeBoundedResourceDefineTimeWindow: Sync = createRouteSync(
  "/TimeBoundedResource/defineTimeWindow",
  async ({ body }) => {
    const resource = requireId(
      body,
      ["resource", "resourceID", "resourceId", "id"],
      "resource"
    );
    await assertOwner(body, resource);
    const availableFrom = parseDateField(
      body,
      ["availableFrom", "from", "start"],
      "availableFrom"
    );
    const availableUntil = parseDateField(
      body,
      ["availableUntil", "until", "end"],
      "availableUntil"
    );
    await TimeBoundedResource.defineTimeWindow({
      resource,
      availableFrom: availableFrom ?? null,
      availableUntil: availableUntil ?? null,
    });
    return {};
  }
);

export const TimeBoundedResourceExpireResource: Sync = createRouteSync(
  "/TimeBoundedResource/expireResource",
  async ({ body }) => {
    const resource = requireId(
      body,
      ["resource", "resourceID", "resourceId", "id"],
      "resource"
    );
    await assertOwner(body, resource);
    await TimeBoundedResource.expireResource({ resource });
    return {};
  }
);

export const TimeBoundedResourceDeleteTimeWindow: Sync = createRouteSync(
  "/TimeBoundedResource/deleteTimeWindow",
  async ({ body }) => {
    const resource = requireId(
      body,
      ["resource", "resourceID", "resourceId", "id"],
      "resource"
    );
    await assertOwner(body, resource);
    await TimeBoundedResource.deleteTimeWindow({ resource });
    return {};
  }
);

export const TimeBoundedResourceConceptGetTimeWindow: Sync = createRouteSync(
  "/TimeBoundedResourceConcept/getTimeWindow",
  async ({ body }) => {
    const resource = requireId(
      body,
      ["resource", "resourceID", "resourceId", "id"],
      "resource"
    );
    const window = await TimeBoundedResource.getTimeWindow({ resource });
    return window ? { timeWindow: window } : {};
  }
);

export const FollowingFollow: Sync = createRouteSync(
  "/Following/follow",
  async ({ body }) => {
    console.log(
      `[Sync] /Following/follow payload: ${JSON.stringify(body, null, 2)}`
    );
    const follower = requireId(
      body,
      ["follower", "followerId", "user"],
      "follower"
    );
    {
      const authUser = pickAuthUser(body);
      if (!authUser || String(follower) !== authUser) {
        throw new Error("Forbidden: follower must match authenticated user.");
      }
    }
    const followee = requireId(
      body,
      ["followee", "followeeId", "target", "id"],
      "followee"
    );
    console.log(
      `[Sync] /Following/follow normalized -> follower=${String(
        follower
      )} followee=${String(followee)}`
    );
    // IMPORTANT: Instrumented concepts expect a single object payload.
    // Passing positional args will be treated as a string and coerced into a char-indexed object.
    await Following.follow({ follower, followee });
    return {};
  }
);

export const FollowingUnfollow: Sync = createRouteSync(
  "/Following/unfollow",
  async ({ body }) => {
    const follower = requireId(
      body,
      ["follower", "followerId", "user"],
      "follower"
    );
    {
      const authUser = pickAuthUser(body);
      if (!authUser || String(follower) !== authUser) {
        throw new Error("Forbidden: follower must match authenticated user.");
      }
    }
    const followee = requireId(
      body,
      ["followee", "followeeId", "target", "id"],
      "followee"
    );
    // IMPORTANT: Instrumented concepts expect a single object payload.
    await Following.unfollow({ follower, followee });
    return {};
  }
);

export const NotificationLogLogNotification: Sync = createRouteSync(
  "/NotificationLog/logNotification",
  async ({ body }) => {
    const recipient = requireId(
      body,
      ["recipient", "recipientId", "user", "id"],
      "recipient"
    );
    const content = requireString(body, ["content"], "content", {
      trim: false,
    });
    return await NotificationLog.logNotification({ recipient, content });
  }
);

export const NotificationLogMarkAsDelivered: Sync = createRouteSync(
  "/NotificationLog/markAsDelivered",
  async ({ body }) => {
    const notificationID = requireId(
      body,
      ["notificationID", "notificationId", "id"],
      "notificationID"
    );
    await NotificationLog.markAsDelivered({ notificationID });
    return {};
  }
);

export const NotificationLogDismissNotification: Sync = createRouteSync(
  "/NotificationLog/dismissNotification",
  async ({ body }) => {
    const notificationID = requireId(
      body,
      ["notificationID", "notificationId", "id"],
      "notificationID"
    );
    await NotificationLog.dismissNotification({ notificationID });
    return {};
  }
);

export const NotificationLogClearDismissedNotifications: Sync = createRouteSync(
  "/NotificationLog/clearDismissedNotifications",
  async ({ body }) => {
    const recipient = requireId(
      body,
      ["recipient", "recipientId", "user", "id"],
      "recipient"
    );
    await NotificationLog.clearDismissedNotifications({ recipient });
    return {};
  }
);

export const NotificationLogGetNotifications: Sync = createRouteSync(
  "/NotificationLog/getNotifications",
  async ({ body }) => {
    const recipient = requireId(
      body,
      ["recipient", "recipientId", "user", "id"],
      "recipient"
    );
    const delivered = pickBoolean(body, ["delivered"]);
    const dismissed = pickBoolean(body, ["dismissed"]);
    return await NotificationLog.getNotifications({
      recipient,
      delivered,
      dismissed,
    });
  }
);

export const NotificationLogListNotificationsWithContent: Sync =
  createRouteSync(
    "/NotificationLog/listNotificationsWithContent",
    async ({ body }) => {
      const recipient = requireId(
        body,
        ["recipient", "recipientId", "user", "id"],
        "recipient"
      );
      const delivered = pickBoolean(body, ["delivered"]);
      const dismissed = pickBoolean(body, ["dismissed"]);
      return await NotificationLog.listNotificationsWithContent({
        recipient,
        delivered,
        dismissed,
      });
    }
  );

export const NotificationLogGetNotificationWithContent: Sync = createRouteSync(
  "/NotificationLog/getNotificationWithContent",
  async ({ body }) => {
    const notificationID = requireId(
      body,
      ["notificationID", "notificationId", "id"],
      "notificationID"
    );
    return await NotificationLog.getNotificationWithContent({ notificationID });
  }
);

// Maintenance: cleanup resources whose time window has expired
export const MaintenanceCleanupExpiredResources: Sync = createRouteSync(
  "/Maintenance/cleanupExpiredResources",
  async ({ body }) => {
    const limitRaw = body["limit"];
    const limit =
      typeof limitRaw === "number" && Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.floor(limitRaw)
        : 200; // default batch size
    const now = new Date();
    const { resourceIDs } = await TimeBoundedResource.listExpiredResources({
      now,
    });
    const toProcess = resourceIDs.slice(0, limit);

    let deleted = 0;
    const errors: Array<{ resource: ID; error: string }> = [];
    for (const resource of toProcess) {
      try {
        // Best-effort: delete the time window first, then resource, then clear intent if any
        try {
          await TimeBoundedResource.deleteTimeWindow({ resource });
        } catch (_) {
          // ignore: might have been cleared already
        }
        try {
          // Clear intent if present (ignore if none)
          const intent = await ResourceIntent.getIntent({ resource });
          if (intent) {
            await ResourceIntent.clearIntent({ resource });
          }
        } catch (_) {
          // ignore intent cleanup failures
        }
        await Resource.deleteResource({ resourceID: resource });
        deleted += 1;
      } catch (e) {
        errors.push({
          resource,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return {
      scanned: resourceIDs.length,
      processed: toProcess.length,
      deleted,
      remaining: resourceIDs.length - toProcess.length,
      errors,
      timestamp: now.toISOString(),
    };
  }
);

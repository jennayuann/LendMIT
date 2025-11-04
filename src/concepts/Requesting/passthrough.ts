/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  "/api/UserAuthentication/registerUser":
    "allow self-service account registration",
  "/api/UserAuthentication/sendVerificationCode":
    "support users requesting their own verification codes",
  "/api/UserAuthentication/verifyCode":
    "let users complete verification without extra indirection",
  "/api/UserAuthentication/login":
    "permit credential checks needed for session creation",
  "/api/Resource/getResource": "publicly expose read-only resource details",
  "/api/Resource/listResources":
    "allow unauthenticated browsing of available resources",
  "/api/Resource/listResourcesByOwner":
    "enable clients to load owner-scoped resource lists",
  "/api/ResourceIntent/getIntent":
    "surface a resource's declared intent for display",
  "/api/ResourceIntent/listIntents": "publish the catalog of defined intents",
  "/api/ResourceIntent/listResourcesByIntent":
    "allow browsing resources by intent label",
  "/api/TimeBoundedResource/getTimeWindow":
    "share availability windows for scheduling purposes",
  "/api/Following/isFollowing":
    "expose read-only following checks for UI state",
  "/api/Following/getFollowees":
    "support listing who a user follows for public profiles",
  "/api/Following/getFollowers":
    "support listing followers where visibility is allowed",
  "/api/NotificationLog/listNotificationsWithContent":
    "publish human-readable notifications for UI rendering",
  "/api/NotificationLog/getNotificationWithContent":
    "fetch a single notification with parsed content for detail views",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // Internal/maintenance methods (do not expose via passthrough)
  "/api/Following/initialize",
  "/api/Following/ensureIndexes",
  "/api/Following/migrateLegacyCollection",
  "/api/TimeBoundedResource/listExpiredResources",
  "/api/UserAuthentication/getEmail",
  "/api/UserAuthentication/changePassword",
  "/api/UserAuthentication/activateUser",
  "/api/UserAuthentication/deactivateUser",
  "/api/UserAuthentication/revokeVerification",
  "/api/UserAuthentication/cleanExpiredCodes",
  "/api/UserProfile/createProfile",
  "/api/UserProfile/updateProfile",
  "/api/UserProfile/deleteProfile",
  "/api/UserProfile/getProfile",
  "/api/Resource/createResource",
  "/api/Resource/updateResource",
  "/api/Resource/deleteResource",
  "/api/ResourceIntent/defineIntent",
  "/api/ResourceIntent/undefineIntent",
  "/api/ResourceIntent/setIntent",
  "/api/ResourceIntent/clearIntent",
  "/api/TimeBoundedResource/defineTimeWindow",
  "/api/TimeBoundedResource/expireResource",
  "/api/TimeBoundedResource/deleteTimeWindow",
  "/api/Following/follow",
  "/api/Following/unfollow",
  "/api/NotificationLog/logNotification",
  "/api/NotificationLog/markAsDelivered",
  "/api/NotificationLog/dismissNotification",
  "/api/NotificationLog/clearDismissedNotifications",
  "/api/NotificationLog/getNotifications",
];

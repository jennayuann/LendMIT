## To Run:
```
deno task concepts
```
# Backend Design Updates (Assignment 4b)
Also copy and pasted at the end of the Comprehensive Design File -> [Comprehensive Design File](design/concepts/Comprehensive%20Design%20File.md)

## 1. Removed Concept: `ResourceStatus`
The `ResourceStatus` concept was **removed entirely**.

### Rationale
- The lifecycle state management previously handled by `ResourceStatus` (e.g., `available`, `requested`, `lent`, `returned`) was too rigid and duplicated information that could be inferred from related concepts (`ResourceIntent`, `TimeBoundedResource`).
- Simplifying this logic allowed for cleaner queries, reduced coupling across collections, and made it easier for the frontend to maintain reactive state directly.

### Impact
- All backend logic previously referencing `ResourceStatus` was removed.
- The system now relies on `TimeBoundedResource`'s start and end time of a resource and owners to delete posts to manage visibility of a resource on the MatchBoard.


## 2. Added Query: `deleteTimeWindow` in `TimeBoundedResource`
### Purpose
Ensures synchronized deletion across related concepts when a post is deleted.

### Behavior
When a `TimeBoundedResource` entry is deleted, the backend automatically deletes all corresponding records in:
- `Resource`
- `ResourceIntent`
- `TimeBoundedResource`

### Rationale
- `TimeBoundedResource` originally lacked a delete action.
- Prevents orphaned records in MongoDB.
- Keeps the data model consistent across all collections.


## 3. Added Query — `getEmail` in `UserAuthentication`

### **Purpose**
Enables users to contact post owners directly from the interface.

### **Description**
This query retrieves a user’s registered email given their user ID.
The frontend uses this email to open a prefilled Outlook draft with the post owner’s email address auto-populated in the **“To”** field.

### **Example Flow**
1. A user clicks **“Contact Owner”** on a listing.
2. The frontend calls `UserAuthentication.getEmail(ownerId)`.
3. The browser opens Outlook with the owner’s email prefilled.

### **Benefits**
- Streamlines communication between borrowers and lenders.
- Improves overall user experience with one-click contact initiation.


## 4. API Specification Updates

### **Description**
The API specification was regenerated to reflect the two new queries and the removal of `ResourceStatus`.

### **Deprecated Endpoints**
- All `/ResourceStatus/...` endpoints have been removed.

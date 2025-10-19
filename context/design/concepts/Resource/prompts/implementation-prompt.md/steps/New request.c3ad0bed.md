---
timestamp: 'Sat Oct 18 2025 23:01:09 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_230109.c9e3bdf7.md]]'
content_id: c3ad0bed999fbe69e7257661b06fd7783c0bffe92912a23fc5e2e3b967944c42
---

# New request: iterate on the response above.

Make updateResource atomic to prevent race conditions, such as doing the following:

```
const result = await this.resources.updateOne(
  { _id: resourceID },
  updateOperations,
);
if (result.matchedCount === 0) throw new Error(`Resource with ID '${resourceID}' not found.`);

```

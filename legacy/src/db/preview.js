import { createDatabaseClient } from '../../../api/src/db/client.js';

// Read-only UI mode still reads the real database. No local catalog fallback.
export function createPreviewClient(db = createDatabaseClient()) {
  return {
    ...Object.fromEntries(['dish', 'restaurant', 'story', 'chef', 'ingredient'].map(name => [name, db[name]])),
    $disconnect: () => db.$disconnect?.(),
  };
}

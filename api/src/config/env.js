import dotenv from 'dotenv';

// Resolve from this module, not cwd, so root commands and standalone API agree.
// Existing process env wins (including isolated integration database URLs).
dotenv.config({ path: new URL('../../.env', import.meta.url), quiet: true });

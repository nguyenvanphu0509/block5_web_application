import { createApi } from '../../api/src/app.js';
import { createFixture } from '../fixtures.js';
const { db } = createFixture();
const server = createApi({ db, origin: 'http://localhost:5174', storage: { upload: async () => '/images/greens.svg', remove: async () => {} } }).listen(3100, 'localhost');
process.on('SIGTERM', () => server.close());

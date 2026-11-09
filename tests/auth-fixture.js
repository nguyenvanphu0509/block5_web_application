// Catalog contract tests run as a signed administrator. Production has no bypass.
import express from 'express';
import { createApi as createActualApi } from '../api/src/app.js';
import { createJwt } from '../api/src/auth/jwt.js';
export function createAdminSession() {
  const jwt = createJwt({ secret: 'catalog-test-key-only-32-bytes-minimum' });
  return { accessToken: jwt.sign({ id: 1, role: 'admin' }), user: { id: 1, username: 'E2E', email: 'e2e@example.test', role: 'admin' } };
}
export function createApi(options) {
  const jwt = createJwt({ secret: 'catalog-test-key-only-32-bytes-minimum' });
  const token = jwt.sign({ id: 1, role: 'admin' });
  const app = express();
  app.use((req, res, next) => { req.headers.authorization ||= `Bearer ${token}`; next(); });
  app.use(createActualApi({ ...options, auth: { ...jwt } }));
  return app;
}

import { handleFetch } from '../../backend/dispatch.mjs';

export default async request => handleFetch(request);

export const config = {
  path: ['/api/*', '/healthz'],
};

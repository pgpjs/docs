import { handleNodeRequest, isChatScanPath } from './dispatch.mjs';

/** Serve ChatScan REST from the local docs server. */
export function chatscanBackend(req, res, next) {
  const pathOnly = (req.url || '/').split('?')[0];
  if (!isChatScanPath(pathOnly)) {
    next();
    return;
  }
  handleNodeRequest(req, res).catch(() => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          error: {
            code: 'internal_error',
            message: 'ChatScan backend failed.',
          },
        }),
      );
    }
  });
}

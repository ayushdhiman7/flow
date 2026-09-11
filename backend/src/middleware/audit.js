import { AuditLog } from '../modules/audit/audit.model.js';

export function auditLog(action, resource) {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const logData = {
          userId: req.user?.id,
          action,
          resource,
          resourceId: req.params.id || req.body?._id,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeBody(req.body),
          },
        };

        AuditLog.create(logData).catch(err => console.error('Audit log error:', err));
      }
      return originalSend.call(this, body);
    };
    next();
  };
}

function sanitizeBody(body) {
  if (!body) return {};
  const { password, confirmPassword, accessToken, refreshToken, ...safe } = body;
  return safe;
}
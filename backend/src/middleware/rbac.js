const roleHierarchy = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const userRole = req.user.role || 'member';
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = Math.max(...allowedRoles.map(r => roleHierarchy[r] || 0));

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function authorizeWorkspace(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!req.workspaceRole) return res.status(403).json({ error: 'Workspace role not found' });

    const userLevel = roleHierarchy[req.workspaceRole] || 0;
    const requiredLevel = Math.max(...allowedRoles.map(r => roleHierarchy[r] || 0));

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient workspace permissions' });
    }
    next();
  };
}

export function checkResourceOwnership(resourceUserIdField = 'userId') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const resourceUserId = req.resource?.[resourceUserIdField];
    const isOwner = resourceUserId && resourceUserId.toString() === req.user.id;
    const isAdmin = ['owner', 'admin'].includes(req.workspaceRole);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to modify this resource' });
    }
    next();
  };
}
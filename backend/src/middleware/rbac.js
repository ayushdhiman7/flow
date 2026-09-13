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

async function resolveWorkspaceId(req) {
  if (req.params.workspaceId) return req.params.workspaceId;
  if (req.params.id && req.baseUrl.includes('/workspaces') && !req.baseUrl.includes('/boards') && !req.baseUrl.includes('/lists') && !req.baseUrl.includes('/channels') && !req.baseUrl.includes('/notes')) {
    return req.params.id;
  }
  if (req.params.boardId) {
    const { Board } = await import('../modules/boards/board.model.js');
    const board = await Board.findById(req.params.boardId).select('workspace');
    return board?.workspace?.toString() || null;
  }
  let listId = req.params.listId;
  if (!listId) {
    const m = (req.baseUrl + req.path).match(/\/lists\/([0-9a-fA-F]{24})/) || req.originalUrl.match(/\/lists\/([0-9a-fA-F]{24})/);
    if (m) listId = m[1];
  }
  if (listId) {
    const { List } = await import('../modules/lists/list.model.js');
    let list = null;
    try { list = await List.findById(listId).select('board'); } catch { list = null; }
    if (list) {
      const { Board } = await import('../modules/boards/board.model.js');
      const board = await Board.findById(list.board).select('workspace');
      if (board?.workspace) return board.workspace.toString();
    }
    // fallback: for card move, target list is in body
    if (req.body?.listId) {
      const { List: List2 } = await import('../modules/lists/list.model.js');
      let tList = null;
      try { tList = await List2.findById(req.body.listId).select('board'); } catch { tList = null; }
      if (tList) {
        const { Board } = await import('../modules/boards/board.model.js');
        const board2 = await Board.findById(tList.board).select('workspace');
        if (board2?.workspace) return board2.workspace.toString();
      }
    }
    return null;
  }
  if (req.params.id && req.baseUrl.includes('/boards/')) {
    const { Board } = await import('../modules/boards/board.model.js');
    const board = await Board.findById(req.params.id).select('workspace');
    if (board) return board.workspace.toString();
  }
  if (req.params.id && req.baseUrl.includes('/lists')) {
    const { List } = await import('../modules/lists/list.model.js');
    const list = await List.findById(req.params.id).select('board');
    if (list) {
      const { Board } = await import('../modules/boards/board.model.js');
      const board = await Board.findById(list.board).select('workspace');
      return board?.workspace?.toString() || null;
    }
  }
  return null;
}

export function authorizeWorkspace(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      let workspaceRole = req.workspaceRole;
      if (!workspaceRole) {
        const workspaceId = await resolveWorkspaceId(req);
        if (!workspaceId) return res.status(403).json({ error: 'Workspace role not found' });
        const { getMemberRole } = await import('../modules/workspaces/workspace.service.js');
        workspaceRole = await getMemberRole(workspaceId, req.user.id);
        req.workspaceRole = workspaceRole;
        req.workspaceIdResolved = workspaceId;
      }
      if (!workspaceRole) return res.status(403).json({ error: 'Not a member of this workspace' });
      const userLevel = roleHierarchy[workspaceRole] || 0;
      // allow if user has at least the lowest required role (e.g. member can read where member/admin/owner allowed)
      const requiredLevel = Math.min(...allowedRoles.map(r => roleHierarchy[r] || 0));
      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: 'Insufficient workspace permissions' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function attachWorkspaceRole(req, res, next) {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    if (workspaceId) {
      const { getMemberRole } = await import('../modules/workspaces/workspace.service.js');
      req.workspaceRole = await getMemberRole(workspaceId, req.user.id);
      req.workspaceIdResolved = workspaceId;
    }
    next();
  } catch (err) {
    next(err);
  }
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
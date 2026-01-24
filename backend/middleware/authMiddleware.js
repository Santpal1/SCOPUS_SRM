// Auth Middleware for role-based access control
const db = require('../config/db');

// Verify JWT-like token (for now using session/stored token)
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.body.token || req.query.token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  // Store token in request for later use
  req.token = token;
  next();
};

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  const userId = req.body.userId || req.query.userId || req.headers['user-id'];
  const username = req.body.username || req.query.username || req.headers['username'];
  
  if (!userId && !username) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  req.userId = userId;
  req.username = username;
  next();
};

// Check role-based access (access_level)
// access_level: 1 = Admin, 2 = Faculty (full access), 3 = Faculty (restricted - own data only)
exports.checkAccessLevel = (allowedLevels) => {
  return (req, res, next) => {
    const accessLevel = req.body.accessLevel || req.query.accessLevel || req.headers['access-level'];
    const username = req.body.username || req.query.username || req.headers['username'];
    
    if (!accessLevel) {
      return res.status(403).json({ success: false, message: 'Access level not provided' });
    }

    const level = parseInt(accessLevel);
    
    if (!allowedLevels.includes(level)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required level: ${allowedLevels}, Your level: ${level}` 
      });
    }

    req.accessLevel = level;
    req.username = username;
    next();
  };
};

// Admin only (access_level = 1)
exports.adminOnly = (req, res, next) => {
  const accessLevel = parseInt(req.body.accessLevel || req.query.accessLevel || req.headers['access-level'] || 0);
  
  if (accessLevel !== 1) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  
  next();
};

// Faculty only (access_level = 2 or 3)
exports.facultyOnly = (req, res, next) => {
  const accessLevel = parseInt(req.body.accessLevel || req.query.accessLevel || req.headers['access-level'] || 0);
  
  if (accessLevel !== 2 && accessLevel !== 3) {
    return res.status(403).json({ 
      success: false, 
      message: 'Faculty access required' 
    });
  }
  
  next();
};

// Restricted faculty (access_level = 3) - can only view own data
exports.restrictedFacultyOnly = (req, res, next) => {
  const accessLevel = parseInt(req.body.accessLevel || req.query.accessLevel || req.headers['access-level'] || 0);
  const facultyId = req.body.facultyId || req.query.facultyId || req.headers['faculty-id'];
  
  if (accessLevel !== 3) {
    return res.status(403).json({ 
      success: false, 
      message: 'Restricted faculty access required' 
    });
  }
  
  req.facultyId = facultyId;
  next();
};

// Verify user owns the resource (for restricted faculty)
exports.verifyOwnership = (resourceFacultyId) => {
  return (req, res, next) => {
    const accessLevel = parseInt(req.body.accessLevel || req.query.accessLevel || req.headers['access-level'] || 0);
    const userFacultyId = req.body.facultyId || req.query.facultyId || req.headers['faculty-id'];
    
    // Admin (level 1) and full access faculty (level 2) can access any resource
    if (accessLevel === 1 || accessLevel === 2) {
      return next();
    }
    
    // Restricted faculty (level 3) can only access their own resources
    if (accessLevel === 3) {
      if (userFacultyId !== resourceFacultyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only access your own faculty data' 
        });
      }
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied' 
    });
  };
};

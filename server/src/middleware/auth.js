const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido' });
      }

      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
      }

      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(user.role)) {
          return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      return res.status(500).json({ error: 'Error de autenticación' });
    }
  };
};

module.exports = auth;

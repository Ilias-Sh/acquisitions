import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

const authMiddleware = (req, res, next) => {
  try {
    const token = cookies.get(req, 'token');

    if (!token) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'No access token provided' });
    }

    const decoded = jwttoken.verify(token);

    req.user = decoded;

    next();
  } catch (e) {
    logger.error('Auth middleware error', e);
    return res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

export default authMiddleware;

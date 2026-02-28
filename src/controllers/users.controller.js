import logger from '#config/logger.js';
import { formatValidationError } from '#utils/format.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { getAllUsers, getUserById as getUserByIdService, updateUser as updateUserService, deleteUser as deleteUserService } from '#services/users.services.js';
import { hashPassword } from '#services/auth.service.js';

export const fetchAllUsers = async(req, res, next) => {
  try{
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  }catch(e){
    logger.error(e);
    next(e);
  }
};

export const fetchUserById = async(req, res, next) => {
  try{
    const validationResult = userIdSchema.safeParse(req.params);

    if(!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting user ${id}...`);

    const user = await getUserByIdService(id);

    res.json({ message: 'Successfully retrieved user', user });
  }catch(e){
    logger.error('Get user by id error', e);

    if(e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const updateUser = async(req, res, next) => {
  try{
    const idResult = userIdSchema.safeParse(req.params);

    if(!idResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(idResult.error),
      });
    }

    const bodyResult = updateUserSchema.safeParse(req.body);

    if(!bodyResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(bodyResult.error),
      });
    }

    const { id } = idResult.data;
    const updates = bodyResult.data;

    // Only allow users to update their own profile, unless admin
    if(req.user?.role !== 'admin' && req.user?.id !== id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only update your own profile' });
    }

    // Only admins can change roles
    if(updates.role && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can change user roles' });
    }

    // Hash password if it is being updated
    if(updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const user = await updateUserService(id, updates);

    logger.info(`User ${id} updated successfully`);

    res.json({ message: 'User updated successfully', user });
  }catch(e){
    logger.error('Update user error', e);

    if(e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const deleteUser = async(req, res, next) => {
  try{
    const validationResult = userIdSchema.safeParse(req.params);

    if(!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Only allow users to delete their own account, unless admin
    if(req.user?.role !== 'admin' && req.user?.id !== id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own account' });
    }

    await deleteUserService(id);

    logger.info(`User ${id} deleted successfully`);

    res.json({ message: 'User deleted successfully' });
  }catch(e){
    logger.error('Delete user error', e);

    if(e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

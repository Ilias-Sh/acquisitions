import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';

const userFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  created_at: users.created_at,
  updated_at: users.updated_at,
};

export const getAllUsers = async() => {
  try{
    return await db.select(userFields).from(users);
  }catch(e){
    logger.error('Error getting users', e);
    throw e;
  }
};

export const getUserById = async(id) => {
  try{
    const [user] = await db.select(userFields).from(users).where(eq(users.id, id)).limit(1);

    if(!user) throw new Error('User not found');

    return user;
  }catch(e){
    logger.error(`Error getting user by id ${id}`, e);
    throw e;
  }
};

export const updateUser = async(id, updates) => {
  try{
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);

    if(!existing) throw new Error('User not found');

    const [updated] = await db
      .update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning(userFields);

    logger.info(`User ${id} updated successfully`);

    return updated;
  }catch(e){
    logger.error(`Error updating user ${id}`, e);
    throw e;
  }
};

export const deleteUser = async(id) => {
  try{
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);

    if(!existing) throw new Error('User not found');

    await db.delete(users).where(eq(users.id, id));

    logger.info(`User ${id} deleted successfully`);
  }catch(e){
    logger.error(`Error deleting user ${id}`, e);
    throw e;
  }
};

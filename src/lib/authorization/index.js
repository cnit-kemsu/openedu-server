import { GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { Cache } from './Caching';
import Course from './Course';
import Subsection from './Subsection';
import Unit from './Unit';
import User, { updateToken, deleteToken } from './User';
import Section from './Section';

export {
  updateToken,
  deleteToken
};

Cache.createCachedValues('users', User);
Cache.createCachedValues('courses', Course);
Cache.createCachedValues('subsections', Subsection);
Cache.createCachedValues('units', Unit);
Cache.createCachedValues('sections', Section);

export async function findUser(id, db) {
  if (id === undefined) throw new GraphQLError(`Not signed in`, ClientInfo.PERMISSION_DENIED);
  const user = await Cache.find('users', id, db);
  if (user === undefined) throw new GraphQLError(`Invalid user key`, ClientInfo.PERMISSION_DENIED);
  return user;
}

export function findLocalUser(id) {
  return Cache.findLocal('users', id);
}

export async function findCourse(id, db) {
  const course = await Cache.find('courses', id, db);
  if (course === undefined) throw new GraphQLError(`Invalid course key`, ClientInfo.PERMISSION_DENIED);
  return course;
}

export async function findSubsection(id, db) {
  const subsection = await Cache.find('subsections', id, db);
  if (subsection === undefined) throw new GraphQLError(`Invalid subsection key`, ClientInfo.PERMISSION_DENIED);
  return subsection;
}

export async function findUnit(id, db) {
  const unit = await Cache.find('units', id, db);
  if (unit === undefined) throw new GraphQLError(`Invalid unit key`, ClientInfo.PERMISSION_DENIED);
  return unit;
}

export async function verifySuperuserRole(id, db) {
  const user = await findUser(id, db);
  if (user.role !== 'superuser') throw new GraphQLError(`You do not have permission to perform the action`, ClientInfo.PERMISSION_DENIED);
  return user;
}

export async function verifyAdminRole(id, db) {
  const user = await findUser(id, db);
  if (user.role === 'superuser') return user;
  if (user.role !== 'admin') throw new GraphQLError(`You do not have permission to perform the action`, ClientInfo.PERMISSION_DENIED);
  return user;
}

export async function verifyInstructorRole(id, db) {
  const user = await findUser(id, db);
  if (user.role === 'superuser') return user;
  if (user.role === 'admin') throw user;
  if (user.role === 'instructor') return user;
  throw new GraphQLError(`You do not have permission to perform the action`, ClientInfo.PERMISSION_DENIED);
}

export async function findSection(id, db) {
  const section = await Cache.find('sections', id, db);
  if (section === undefined) throw new GraphQLError(`Invalid section key`, ClientInfo.PERMISSION_DENIED);
  return section;
}
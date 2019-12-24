import { GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { Cache } from './Caching';

export async function findUser(id, db) {
  if (id === undefined) throw new GraphQLError(`Not signed in`, ClientInfo.PERMISSION_DENIED);
  const user = await Cache.find('users', id, db);
  if (user === undefined) throw new GraphQLError(`Invalid user key`, ClientInfo.PERMISSION_DENIED);
  return user;
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

export async function verifySuperuserRole(id, db) {
  const user = await findUser(id, db);
  if (user.role !== 'superuser') throw new GraphQLError(`You do not have permission to perform the action`, ClientInfo.PERMISSION_DENIED);
  return user;
}

export async function verifyAdminRole(id, db) {
  const user = await findUser(id, db);
  if (user.role === 'superuser') return;
  if (user.role !== 'admin') throw new GraphQLError(`You do not have permission to perform the action`, ClientInfo.PERMISSION_DENIED);
  return user;
}
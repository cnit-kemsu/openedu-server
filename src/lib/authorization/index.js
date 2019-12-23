import { GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { getUser } from './User';
export { getUser };
export { getSubsection } from './User';

export async function verifySignedIn(user) {
  if (user === undefined) throw new GraphQLError("Not signed in", ClientInfo.PERMISSION_DENIED);
  const _user = await getUser(user.id);
  return _user;
}

export async function verifySuperuserRole(user, db) {
  const _user = await verifySignedIn(user, db);
  if (_user.role !== 'superuser') throw new GraphQLError("You do not have permission to perform the action", ClientInfo.PERMISSION_DENIED);
}

export async function verifyAdminRole(user, db) {
  const _user = await verifySignedIn(user, db);
  if (_user.role === 'superuser') return;
  if (_user.role !== 'admin') throw new GraphQLError("You do not have permission to perform the action", ClientInfo.PERMISSION_DENIED);
}
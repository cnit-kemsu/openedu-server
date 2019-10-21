import { GraphQLError, ClientInfo } from '@kemsu/graphql-server';

export function verifySignedIn(user) {
  if (user === undefined) throw new GraphQLError("Not signed in", ClientInfo.PERMISSION_DENIED);
}

export async function verifyUserRole(user, db) {
  verifySignedIn(user);
  const [{ role }] = await db.query(`SELECT get_user_role(?) role;`, user.id);
  if (role === null) throw new GraphQLError("Invalid user", ClientInfo.PERMISSION_DENIED);
  user.role = role;
  user.roleVerified = true;
  return role;
}

export async function verifySuperuserRole(user, db) {
  const role = await verifyUserRole(user, db);
  if (role !== 'superuser') throw new GraphQLError("You do not have permission to perform the action", ClientInfo.PERMISSION_DENIED);
}

export async function verifyAdminRole(user, db) {
  const role = await verifyUserRole(user, db);
  if (role === 'superuser') return;
  if (role !== 'admin') throw new GraphQLError("You do not have permission to perform the action", ClientInfo.PERMISSION_DENIED);
}
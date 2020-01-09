import { types as _, _escape } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import RoleInputEnumType from './RoleInputEnumType';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    role: { type: _.NonNull(RoleInputEnumType) }
  },
  async resolve(obj, { id, role }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const { affectedRows } = await db.query(`UPDATE users SET role = ${_escape(role)} WHERE id = ${id}`);
    return affectedRows;
  }
};
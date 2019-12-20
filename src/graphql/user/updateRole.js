import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import RoleInputEnumType from './RoleInputEnumType';
import { roleFilter } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    role: { type: _.NonNull(RoleInputEnumType) }
  },
  async resolve(obj, { id, role }, { user, db }) {
    verifyAdminRole(user, db);

    const { affectedRows } = await db.query(`UPDATE users SET role = ${role} WHERE ${roleFilter} AND id = ${id}`)
    return affectedRows;
  }
};
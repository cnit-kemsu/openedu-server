import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { roleFilter } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }) {
    verifyAdminRole(user, db);

    const { affectedRows } = await db.query(`DELETE FROM users WHERE ${roleFilter} AND id = ?`, id);
    return affectedRows;
  }
};
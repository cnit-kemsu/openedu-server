import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole, deleteToken } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const { affectedRows } = await db.query(`DELETE FROM access_tokens WHERE id = ${id}`);
    deleteToken(id);
    return affectedRows;
  }
};
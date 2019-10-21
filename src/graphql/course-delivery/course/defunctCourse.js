import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }) {
    await verifyAdminRole(user, db);

    const { affectedRows } = await db.query(`UPDATE course_delivery_instances SET defunct = 1 WHERE id = ?`, id);
    return affectedRows;
  }
};
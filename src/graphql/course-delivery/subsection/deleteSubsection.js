import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const { affectedRows } = await db.query(`DELETE FROM course_delivery_subsections WHERE id = ${id}`);
    return affectedRows;
  }
};
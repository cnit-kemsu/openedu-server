import { types as _ } from '@kemsu/graphql-server';
import { verifySuperuserRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifySuperuserRole(userId, db);

    const { affectedRows } = await db.query(`DELETE FROM course_delivery_instances WHERE id = ${id}`);
    return affectedRows;
  }
};
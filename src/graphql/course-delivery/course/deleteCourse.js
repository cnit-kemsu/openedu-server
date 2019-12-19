import { types as _ } from '@kemsu/graphql-server';
import { verifySuperuserRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }) {
    await verifySuperuserRole(user, db);

    const { affectedRows } = await db.query(`DELETE FROM course_delivery_instances WHERE id = ${id}`);
    return affectedRows;
  }
};
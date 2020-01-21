import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole, findUnit } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const unit = await findUnit(id, db);
    const { affectedRows } = await db.query(`DELETE FROM course_delivery_units WHERE id = ${id}`);
    
    const course = await unit.getCourse(db);
    course.removeUnit(id);
    return affectedRows;
  }
};
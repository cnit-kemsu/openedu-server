import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole, findUnit } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifyAdminRole(userId, db);

    /*cache*/const unit = await findUnit(id, db);
    /*cache*/const course = await unit.getCourse(db);
    
    const { affectedRows } = await db.query(`DELETE FROM course_delivery_units WHERE id = ${id}`);
    
    /*cache*/course.removeUnit(id);

    return affectedRows;
  }
};
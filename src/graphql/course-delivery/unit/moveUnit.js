import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    movableUnitId: { type: _.NonNull(_.Int) },
    frontUnitId: { type: _.Int }
  },
  async resolve(obj, { movableUnitId, frontUnitId = null }, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      await db.query(`CALL move_course_delivery_unit(?, ?)`, [movableUnitId, frontUnitId]);
      return 1;
    } catch(error) {
      throw error;
    }
  }
};
import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    movingUnitId: { type: _.NonNull(_.Int) },
    putBeforeUnitId: { type: _.Int }
  },
  async resolve(obj, { movingUnitId, putBeforeUnitId = null }, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      await db.query(`CALL move_entry_over('course_delivery_unit', ${movingUnitId}, ${putBeforeUnitId})`);
      return 1;
    } catch(error) {
      throw error;
    }
  }
};
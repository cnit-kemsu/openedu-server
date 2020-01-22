import { types as _ } from '@kemsu/graphql-server';
import { findUser, findUnit } from '@lib/authorization';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    movingUnitId: { type: _.NonNull(_.Int) },
    putBeforeUnitId: { type: _.Int }
  },
  async resolve(obj, { movingUnitId, putBeforeUnitId = null }, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {

      /*cache*/const unit = await findUnit(movingUnitId, db);
      /*cache*/const course = await unit.getCourse(db);
      
      await db.query(`CALL move_entry_over('course_delivery_unit', ${movingUnitId}, ${putBeforeUnitId})`);

      /*cache*/course.swapUnits(movingUnitId, putBeforeUnitId);

      return 1;

    } catch(error) {
      throw error;
    }
  }
};
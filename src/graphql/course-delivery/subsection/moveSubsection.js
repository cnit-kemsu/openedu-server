import { types as _ } from '@kemsu/graphql-server';
import { findSubsection } from '@lib/authorization';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    movingSubsectionId: { type: _.NonNull(_.Int) },
    putBeforeSubsectionId: { type: _.Int }
  },
  async resolve(obj, { movingSubsectionId, putBeforeSubsectionId = null }, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {

      /*cache*/const subsection = await findSubsection(movingSubsectionId, db);
      /*cache*/const course = await subsection.getCourse(db);

      await db.query(`CALL move_entry_over('course_delivery_subsection', ${movingSubsectionId}, ${putBeforeSubsectionId})`);

      /*cache*/course.swapSubsections(movingSubsectionId, putBeforeSubsectionId);

      return 1;

    } catch(error) {
      throw error;
    }
  }
};
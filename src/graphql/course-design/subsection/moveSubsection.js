import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    movingSubsectionId: { type: _.NonNull(_.Int) },
    putBeforeSubsectionId: { type: _.Int }
  },
  async resolve(obj, { movingSubsectionId, putBeforeSubsectionId = null }, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      await db.query(`CALL move_entry_over('course_design_subsection', ${movingSubsectionId}, ${putBeforeSubsectionId})`);
      return 1;
    } catch(error) {
      throw error;
    }
  }
};
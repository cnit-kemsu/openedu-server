import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    movingSectionId: { type: _.NonNull(_.Int) },
    putBeforeSectionId: { type: _.Int }
  },
  async resolve(obj, { movingSectionId, putBeforeSectionId = null }, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      await db.query(`CALL move_entry_over('course_design_section', ${movingSectionId}, ${putBeforeSectionId})`);
      return 1;
    } catch(error) {
      throw error;
    }
  }
};
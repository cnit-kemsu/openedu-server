import { types as _ } from '@kemsu/graphql-server';
import { findSection } from '@lib/authorization';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    movingSectionId: { type: _.NonNull(_.Int) },
    putBeforeSectionId: { type: _.Int }
  },
  async resolve(obj, { movingSectionId, putBeforeSectionId = null }, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {
      
      /*cache*/const section = await findSection(movingSectionId, db);
      /*cache*/const course = await section.getCourse(db);

      await db.query(`CALL move_entry_over('course_delivery_section', ${movingSectionId}, ${putBeforeSectionId})`);
      
      /*cache*/course.swapSections(movingSectionId, putBeforeSectionId);

      return 1;

    } catch(error) {
      throw error;
    }
  }
};
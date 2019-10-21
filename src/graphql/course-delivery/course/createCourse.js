import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { assignInstructors } from '@lib/assignInstructors';

export default {
  type: _.NonNull(_.Int),
  args: {
    templateId: { type: _.NonNull(_.Int) },
    startDate: { type: _.String },
    enrollmentEndDate: { type: _.String },
    price: { type: _.Float },
    instructorKeys: { type: _.JSON }
  },
  async resolve(obj, { templateId, startDate= null, enrollmentEndDate = null, price = null, instructorKeys }, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      
      await db.beginTransaction();

      const [{ insertId }] = await db.query(
        `SELECT create_course_delivery_instance(?, ?, ?, ?, ?) insertId`,
        [templateId, user.id, startDate, enrollmentEndDate, price]
      );

      await assignInstructors(insertId, instructorKeys, db);

      await db.commit();
      return insertId;

    } catch(error) {

      await db.rollback();
      throw error;

    }
  }
};
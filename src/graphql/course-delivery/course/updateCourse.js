import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { assignInstructors } from '@lib/assignInstructors';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.Int },
    name: { type: _.String },
    summary: { type: _.String },
    description: { type: _.JSON },
    picture: { type: _.JSON },
    startDate: { type: _.String },
    enrollmentEndDate: { type: _.String },
    price: { type: _.Float },
    instructorKeys: { type: _.JSON },
    data: { type: _.JSON }
  },
  async resolve(obj, { id, instructorKeys, ...inputArgs }, { user, db }) {
    await verifyAdminRole(user, db);

    if (inputArgs.data != null) inputArgs.data = JSON.stringify(inputArgs.data);

    try {
      
      await db.beginTransaction();

      let affectedRows1 = 0;
      const [assignmentList, params] = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      if (assignmentList !== '') {
        const { affectedRows } = await db.query(`UPDATE course_delivery_instances SET ${assignmentList} WHERE id = ?`, [...params, id]);
        affectedRows1 = affectedRows;
      }
      const affectedRows2 = await assignInstructors(id, instructorKeys, db);

      if (affectedRows1 || affectedRows2) {
        await db.commit();
        return 1;
      }

      await db.rollback();
      return 0;

    } catch(error) {

      await db.rollback();
      throw error;

    }
  }
};
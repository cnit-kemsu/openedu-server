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
    instructorKeys: { type: _.List(_.NonNull(_.Int)) },
    data: { type: _.JSON }
  },
  async resolve(obj, { id, instructorKeys, ...inputArgs }, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      
      await db.beginTransaction();

      let affectedRows = 0;
      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      if (assignmentList !== '') {
        affectedRows += await db.query(`UPDATE course_delivery_instances SET ${assignmentList} WHERE id = ${id}`)
        |> #.affectedRows;
      }
      affectedRows += await assignInstructors(db, id, instructorKeys);

      if (affectedRows > 0) {
        await db.commit();
        return affectedRows;
      }

      await db.rollback();
      return 0;

    } catch(error) {

      await db.rollback();
      throw error;

    }
  }
};
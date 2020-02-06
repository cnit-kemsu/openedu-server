import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    courseId: { type: _.Int },
    comments: { type: _.String },
    emails: { type: _.List(_.NonNull(_.String)) }
  },
  async resolve(obj, { id, ...inputArgs }, { userId, db }) {
    await verifyAdminRole(userId, db);


    try {

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      if (assignmentList === '') return 0;
      const { affectedRows } = await db.query(`UPDATE course_pass_tokens SET ${assignmentList} WHERE id = ${id}`);

      return affectedRows;

    } catch(error) {

      throw error;

    }
  }
};
import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    courseId: { type: _.NonNull(_.Int) },
    comments: { type: _.String },
    emails: { type: _.NonNull(_.List(_.NonNull(_.String))) }
  },
  async resolve(obj, inputArgs, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      const { insertId } = await db.query(`INSERT INTO course_pass_tokens SET ${assignmentList}`);

      return insertId;

    } catch(error) {

      throw error;

    }
  }
};
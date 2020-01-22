import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole, findCourse } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    courseId: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String }
  },
  async resolve(obj, inputArgs, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {
      
      /*cache*/const course = await findCourse(inputArgs.courseId, db);

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs);
      const { insertId } = await db.query(`INSERT INTO course_delivery_sections SET ${assignmentList}`);
      
      /*cache*/course.addSection(insertId);

      return insertId;

    } catch(error) {

      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Раздел с названием '${inputArgs.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;

    }
  }
};
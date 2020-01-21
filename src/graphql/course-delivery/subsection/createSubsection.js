import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole, findSection } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    sectionId: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    accessDate: { type: _.String },
    expirationDate: { type: _.String }
  },
  async resolve(obj, inputArgs, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {
      
      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs);
      const { insertId } = await db.query(`INSERT INTO course_delivery_subsections SET ${assignmentList}`);
      const section = await findSection(inputArgs.sectionId, db);
      const course = await section.getCourse(db);
      course.addSubsection(insertId, inputArgs.sectionId);
      return insertId;

    } catch(error) {

      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Подраздел с названием '${inputArgs.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;

    }
  }
};
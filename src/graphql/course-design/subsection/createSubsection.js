import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    sectionId: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    accessPeriod: { type: _.Int },
    expirationPeriod: { type: _.Int }
  },
  async resolve(obj, inputArgs, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {
      
      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs);
      const { insertId } = await db.query(`INSERT INTO course_design_subsections SET ${assignmentList}`);
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
import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    description: { type: _.JSON },
    picture: { type: _.JSON },
    data: { type: _.JSON }
  },
  async resolve(obj, inputArgs, { userId, db }) {
    await verifyAdminRole(userId, db);

    if (inputArgs.data != null) inputArgs.data = JSON.stringify(inputArgs.data);

    try {
      
      await db.beginTransaction();

      const assignmentList = await sqlBuilder.buildAssignmentList({ ...inputArgs, creatorId: user.id }, { db });
      const { insertId } = await db.query(`INSERT INTO course_design_templates SET ${assignmentList}`);

      await db.commit();
      return insertId;

    } catch(error) {

      await db.rollback();
      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Курс с названием '${inputArgs.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;

    }
  }
};
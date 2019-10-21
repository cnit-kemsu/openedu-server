import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    description: { type: _.JSON },
    picture: { type: _.JSON }
  },
  async resolve(obj, inputArgs, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      
      await db.beginTransaction();

      const [assignmentList, params] = await sqlBuilder.buildAssignmentList(inputArgs, { isUpdateClause: false, db });
      const { insertId } = await db.query(`INSERT INTO course_design_templates SET ${assignmentList}, creator_id = ?`, [...params, user.id]);

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
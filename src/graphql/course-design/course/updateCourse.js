import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    name: { type: _.String },
    summary: { type: _.String },
    description: { type: _.JSON },
    picture: { type: _.JSON }
  },
  async resolve(obj, { id, ...inputArgs }, { user, db }) {
    await verifyAdminRole(user, db);

    try {
      
      await db.beginTransaction();

      const [assignmentList, params] = await sqlBuilder.buildAssignmentList(inputArgs, { isUpdateClause: true, db });
      if (assignmentList === '') {
        await db.rollback();
        return 0;
      }
      const { affectedRows } = await db.query(`UPDATE course_design_templates SET ${assignmentList} WHERE id = ?`, [...params, id]);

      await db.commit();
      return affectedRows;

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
import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    name: { type: _.String },
    summary: { type: _.String }
  },
  async resolve(obj, { id, ...inputArgs }, { user, db }) {
    await verifyAdminRole(user, db);

    try {

      const [assignmentList, params] = await sqlBuilder.buildAssignmentList(inputArgs, { isUpdateClause: true });
      if (assignmentList === '') return 0;
      const { affectedRows } = await db.query(`UPDATE course_delivery_sections SET ${assignmentList} WHERE id = ?`, [...params, id]);
      return affectedRows;

    } catch(error) {

      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Раздел с названием '${inputArgs.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;

    }
  }
};
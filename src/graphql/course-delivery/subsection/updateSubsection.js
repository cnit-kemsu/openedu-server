import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    name: { type: _.String },
    summary: { type: _.String },
    accessDate: { type: _.String },
    expirationDate: { type: _.String }
  },
  async resolve(obj, { id, ...inputArgs }, { user, db }) {
    await verifyAdminRole(user, db);

    try {

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs);
      if (assignmentList === '') return 0;
      const { affectedRows } = await db.query(`UPDATE course_delivery_subsections SET ${assignmentList} WHERE id = ${id}`);
      return affectedRows;

    } catch(error) {

      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Подраздел с названием '${inputArgs.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;

    }
  }
};
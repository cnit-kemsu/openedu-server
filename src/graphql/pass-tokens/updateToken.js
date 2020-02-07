import { types as _, jsonToString } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    comments: { type: _.String },
    courseKeys: { type: _.List(_.NonNull(_.Int)) },
    emails: { type: _.List(_.NonNull(_.String)) }
  },
  async resolve(obj, { id, courseKeys, emails, ...inputArgs }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const _courseKeys = courseKeys && courseKeys || [];
    const _emails = emails && emails || [];
    try {

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      if (assignmentList === '') return 0;
      const { affectedRows } = await db.query(`UPDATE access_tokens SET ${assignmentList} WHERE id = ${id}`);
      await db.query(`set_access_token_attachments(${id}, ${jsonToString(_courseKeys)}, ${jsonToString(_emails)})`);

      return affectedRows;

    } catch(error) {

      throw error;

    }
  }
};
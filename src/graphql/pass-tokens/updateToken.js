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

    const _courseKeys = courseKeys !== null && courseKeys || [];
    const _emails = emails !== null && emails || [];
    try {

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      if (assignmentList === '' && !_courseKeys && !_emails) return 0;

      await db.beginTransaction();
      const { affectedRows } = await db.query(`UPDATE access_tokens SET ${assignmentList} WHERE id = ${id}`);
      if (_courseKeys && _emails) await db.query(`CALL set_access_token_attachments(${id}, ${jsonToString(_courseKeys)}, ${jsonToString(_emails)})`);

      await db.commit();
      return affectedRows;

    } catch(error) {

      await db.rollback();
      throw error;

    }
  }
};
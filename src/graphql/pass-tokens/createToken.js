import { types as _, jsonToString } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    name: { type: _.NonNull(_.String) },
    comments: { type: _.String },
    courseKeys: { type: _.List(_.NonNull(_.Int)) },
    emails: { type: _.List(_.NonNull(_.String)) }
  },
  async resolve(obj, { courseKeys, emails, ...inputArgs }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const _courseKeys = courseKeys && courseKeys || [];
    const _emails = emails && emails || [];
    try {

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      const { insertId } = await db.query(`INSERT INTO access_tokens SET ${assignmentList}`);
      if (insertId) await db.query(`set_access_token_attachments(${insertId}, ${jsonToString(_courseKeys)}, ${jsonToString(_emails)})`);

      return insertId;

    } catch(error) {

      throw error;

    }
  }
};
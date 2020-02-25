import { types as _, jsonToString } from '@kemsu/graphql-server';
import { verifyAdminRole, updateToken } from '@lib/authorization';
import { sqlBuilder, updateUsersTokensCache } from './_shared';

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

    try {
      await db.beginTransaction();

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      const { insertId } = await db.query(`INSERT INTO access_tokens SET ${assignmentList}`);
      if (insertId && (courseKeys || emails)) {
        const [{ diff }] = await db.query(`SELECT set_access_token_attachments(${insertId}, ${jsonToString(courseKeys || null)}, ${jsonToString(emails || null)}) AS diff`);
        if (courseKeys) updateToken(insertId, courseKeys);
        if (emails) await updateUsersTokensCache(insertId, JSON.parse(diff));
      }

      await db.commit();
      return insertId;

    } catch(error) {

      await db.rollback();
      throw error;

    }
  }
};
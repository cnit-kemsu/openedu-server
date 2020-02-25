import { types as _, jsonToString } from '@kemsu/graphql-server';
import { verifyAdminRole, updateToken } from '@lib/authorization';
import { sqlBuilder, updateUsersTokensCache } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    name: { type: _.String },
    comments: { type: _.String },
    courseKeys: { type: _.List(_.NonNull(_.Int)) },
    emails: { type: _.List(_.NonNull(_.String)) }
  },
  async resolve(obj, { id, courseKeys, emails, ...inputArgs }, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      if (assignmentList === '' && !courseKeys && !emails) return 0;

      await db.beginTransaction();

      if (assignmentList !== '') {
        await db.query(`UPDATE access_tokens SET ${assignmentList} WHERE id = ${id}`) |> #.affectedRows;
      }
      if (courseKeys || emails) {
        const [{ diff }] = await db.query(`SELECT set_access_token_attachments(${id}, ${jsonToString(courseKeys || null)}, ${jsonToString(emails || null)}) AS diff`);
        if (courseKeys) updateToken(id, courseKeys);
        if (emails) await updateUsersTokensCache(id, JSON.parse(diff));
      }

      await db.commit();
      return 1;

    } catch(error) {

      await db.rollback();
      throw error;

    }
  }
};
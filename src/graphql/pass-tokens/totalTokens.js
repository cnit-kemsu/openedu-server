import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  async resolve(obj, search, { userId, db }) {
    await verifyAdminRole(userId, db);

    return await db.query(`SELECT COUNT(1) count FROM course_pass_tokens`)
    |> #[0].count;
  }
};
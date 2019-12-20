import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder, searchArgs } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { user, db }) {
    await verifyAdminRole(user, db);

    const whereClause = sqlBuilder.buildWhereClause(search);
    return await db.query(`SELECT COUNT(1) count FROM users ${whereClause}`)
    |> #[0].count;
  }
};
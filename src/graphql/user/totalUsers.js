import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder, roleFilter, searchArgs } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { user, db }) {
    await verifyAdminRole(user, db);

    const [whereClause, params] = sqlBuilder.buildWhereClause(search, [roleFilter]);
    return await db.query(`SELECT COUNT(*) count FROM users ${whereClause}`, params)
    |> #[0].count;
  }
};
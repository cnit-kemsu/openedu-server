import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder, searchArgs } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { userId, db }) {
    await verifyAdminRole(userId, db);

    const whereClause = await sqlBuilder.buildWhereClause(search, ['defunct = 0']);
    return await db.query(`SELECT COUNT(1) count FROM course_design_templates ${whereClause}`)
    |> #[0].count;
  }
};
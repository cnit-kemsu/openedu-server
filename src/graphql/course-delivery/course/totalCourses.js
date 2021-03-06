import { types as _ } from '@kemsu/graphql-server';
import { sqlBuilder, searchArgs } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { userId, db }) {

    const whereClause = await sqlBuilder.buildWhereClause(search, ['defunct = 0'], { userId, db });
    return await db.query(`SELECT COUNT(1) count FROM course_delivery_instances ${whereClause}`)
    |> #[0].count;
  }
};
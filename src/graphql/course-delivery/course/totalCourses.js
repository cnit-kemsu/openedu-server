import { types as _ } from '@kemsu/graphql-server';
import { sqlBuilder, searchArgs } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { user, db }) {

    const [whereClause, params] = sqlBuilder.buildWhereClause(search, ['defunct = 0']);
    return await db.query(`SELECT COUNT(*) count FROM course_delivery_instances ${whereClause}`, params)
    |> #[0].count;
  }
};
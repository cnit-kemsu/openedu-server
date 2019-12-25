import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder, searchArgs } from './_shared';
import UserType from './UserType';

export default {
  type: _.List(UserType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    ...searchArgs
  },
  async resolve(obj, { limit = 10, offset = 0, ...search }, { user, db }, { fields }) {
    await verifyAdminRole(user, db);

    //if (search.keys !== undefined) if (search.keys.length === 0) return [];

    const electExprList = sqlBuilder.buildSelectExprList(fields);
    const whereClause = sqlBuilder.buildWhereClause(search);
    return await db.query(`
      SELECT ${electExprList} FROM users 
      LEFT JOIN unverified_accounts ON id = user_id
      ${whereClause} LIMIT ${limit} OFFSET ${offset}
    `);
  }
} |> upgradeResolveFn;
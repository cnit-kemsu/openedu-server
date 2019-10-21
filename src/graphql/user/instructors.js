import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import UserType from './UserType';
import { searchArgs, sqlBuilder } from './_shared';

export default {
  type: _.List(UserType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    nameLike: { type: _.NonNull(_.String) },
    ...searchArgs
  },
  async resolve(obj, { limit = 5, offset = 0, nameLike, ...search }, { db, user }, { fields }) {
    await verifyAdminRole(user, db);

    const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
    const res = await db.query(`
      SELECT ${selectExprList} FROM users 
      LEFT JOIN unverified_accounts ON id = user_id
      WHERE role = 'instructor' AND (
        email LIKE ? OR (
          ? LIKE CONCAT('%', JSON_VALUE(_data, '$.firstname'), '%')
          OR ? LIKE CONCAT('%', JSON_VALUE(_data, '$.lastname'), '%')
        )
      ) LIMIT ? OFFSET ?
    `, ['%'+nameLike+'%', nameLike, nameLike, limit, offset]);
    return res;
  }
} |> upgradeResolveFn;
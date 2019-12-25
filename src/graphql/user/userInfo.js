import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder, roleFilter } from './_shared';
import UserType from './UserType';

export default {
  type: UserType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }, { fields }) {
    await verifyAdminRole(userId, db);

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM users WHERE id = ${id}`)
    |> #[0];
  }
} |> upgradeResolveFn;
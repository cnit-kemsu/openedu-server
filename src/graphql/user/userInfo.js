import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { sqlBuilder, roleFilter } from './_shared';
import UserType from './UserType';

export default {
  type: UserType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }, { fields }) {
    await verifyAdminRole(user, db);

    const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM users WHERE ${roleFilter} AND id = ?`, id)
    |> #[0];
  }
} |> upgradeResolveFn;
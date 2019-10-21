import { upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyUserRole } from '@lib/authorization';
import UserType from './UserType';
import { sqlBuilder } from './_shared';

export default {
  type: UserType,
  async resolve(obj, args, { user, db }, { fields }) {
    await verifyUserRole(user, db);

    const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM users WHERE id = ?`, user.id)
    |> #[0];
  }
} |> upgradeResolveFn;
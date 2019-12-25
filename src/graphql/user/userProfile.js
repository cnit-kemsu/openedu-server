import { upgradeResolveFn } from '@kemsu/graphql-server';
import { findUser } from '@lib/authorization';
import UserType from './UserType';
import { sqlBuilder } from './_shared';

export default {
  type: UserType,
  async resolve(obj, args, { userId, db }, { fields }) {
    const user = await findUser(userId, db);

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM users WHERE id = ${userId}`)
    |> #[0];
  }
} |> upgradeResolveFn;
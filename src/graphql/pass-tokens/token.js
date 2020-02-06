import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import PassTokenType from './PassTokenType';
import { sqlBuilder } from './_shared';

export default {
  type: PassTokenType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }, { fields }) {
    await verifyAdminRole(userId, db);

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM course_pass_tokens WHERE id = ${id}`)
    |> #[0];
  }
} |> upgradeResolveFn;
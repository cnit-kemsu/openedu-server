import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import PassTokenType from './PassTokenType';
import { sqlBuilder } from './_shared';

export default {
  type: _.List(PassTokenType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
  },
  async resolve(obj, { limit = 10, offset = 0 }, { userId, db }, { fields }) {
    await verifyAdminRole(userId, db);

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    try {
      return await db.query(`SELECT ${selectExprList} FROM access_tokens LIMIT ${limit} OFFSET ${offset}`);
    }
    catch (error) {
      throw error;
    }
  }
} |> upgradeResolveFn;
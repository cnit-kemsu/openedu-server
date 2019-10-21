import { types as _, SQLBuilder } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';

const aliases = {
  name: '_name',
  creatorId: 'creator_id'
};

const selectExprListBuilder = {
  ...aliases,

  summary: 'get_value(summary_value_id)',
  description: 'get_value(description_value_id)',
  picture: 'get_value(picture_value_id)',

  sections: { id: 'id' }
};

const whereConditionBuilder = {
  keys(keyArray) {
    return `id IN (${keyArray})`;
  },
  name: '_name LIKE ?'
};

const assignmentListBuilder = {
  ...aliases,
  summary(value, { isUpdateClause }) {
    return isUpdateClause
    ? ['summary_value_id = update_value(summary_value_id, ?, NULL)', value]
    : ['summary_value_id = create_value(?, NULL)', value];
  },
  async description(value, { db, isUpdateClause }) {
    const fileIdArray = await insertFilesOfValue(db, value);
    return isUpdateClause
    ? [`description_value_id = update_value(description_value_id, ?, '${fileIdArray}')`, value]
    : [`description_value_id = create_value(?, '${fileIdArray}')`, JSON.stringify(value)];
  },
  async picture(value, { isUpdateClause, db }) {
    const fileId = await insertFilesOfValue(db, value);
    return isUpdateClause
    ? [`picture_value_id = update_value(picture_value_id, ?, '${fileId}')`, JSON.stringify(value)]
    : [`picture_value_id = create_value(?, '${fileId}')`, value];
  }
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);

export const searchArgs = {
  keys: { type: _.List(_.Int) },
  name: { type: _.String }
};


import { types as _, SQLBuilder } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';

const aliases = {
  name: '_name',
  creatorId: 'creator_id',
  data: '_data'
};

const selectExprListBuilder = {
  ...aliases,

  summary: 'get_value(summary_value_id)',
  description: 'get_value(description_value_id)',
  picture: 'get_value(picture_value_id)',

  sections: { id: 'id' }
};

const whereConditionBuilder = {
  keys: keyArray => `id IN (${keyArray})`,
  name: '_name LIKE ?'
};

const assignmentListBuilder = {
  ...aliases,
  
  summary: value => ['summary_value_id = set_value(summary_value_id, ?, NULL)', value],
  async description(value, { db }) {
    const fileIdArray = await insertFilesOfValue(db, value);
    return [`description_value_id = set_value(description_value_id, ?, ?)`, value, fileIdArray];
  },
  async picture(value, { db }) {
    const fileIdArray = await insertFilesOfValue(db, value);
    return [`picture_value_id = set_value(picture_value_id, ?, ?)`, value, fileIdArray];
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


import { types as _, SQLBuilder, _escape, escapePattern, jsonToString } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  creatorId: 'creator_id',
  data: '_data',

  summary: 'get_value(summary_value_id)',
  description: 'get_value(description_value_id)',
  picture: 'get_value(picture_value_id)',

  sections: ['id']
};

const pattern = word => `%${word}%`;
function searchWord(word) {
  return escapePattern(word, pattern)
  |> `(_name LIKE ${#})`;
}

const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  searchName: text => text
    .trim().replace(/\s{2,}/g, ' ')
    .split(' ')
    .map(searchWord)
    .join(' AND ')
};

const assignmentListBuilder = {
  name: value => `_name = ${_escape(value)}`,
  creatorId: value => `creator_id = ${value}`,
  data: value => `_data = ${jsonToString(value)}`,
  
  summary: value => `summary_value_id = set_value(summary_value_id, ${_escape(value)}, NULL)`,
  async description(value, { db }) {
    const fileIdArray = await insertFilesOfValue(db, value);
    return `description_value_id = set_value(description_value_id, ${jsonToString(value)}, ${fileIdArray})`;
  },
  async picture(value, { db }) {
    const fileIdArray = await insertFilesOfValue(db, value);
    return `picture_value_id = set_value(picture_value_id, ${jsonToString(value)}, ${fileIdArray})`;
  }
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);

export const searchArgs = {
  keys: { type: _.List(_.Int) },
  searchName: { type: _.String }
};


import { types as _, SQLBuilder, escapePattern, escape, jsonToString, getJSON } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';
import RoleEnumType from './RoleEnumType';

const selectExprListBuilder = {
  verified: `IF(passkey IS NULL, TRUE, FALSE)`,
  firstname: getJSON('_data', 'firstname'),
  lastname: getJSON('_data', 'lastname'),
  middlename: getJSON('_data', 'middlename'),
  picture: `get_value(picture_value_id)`
};

const pattern = word => `%${word}%`;
function searchWord(word) {
  return escapePattern(word, pattern)
  |> `(email LIKE ${#} OR JSON_VALUE(_data, '$.firstname') LIKE ${#} OR JSON_VALUE(_data, '$.lastname') LIKE ${#})`;
}
const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  searchText: text => text
    .trim().replace(/\s{2,}/g, ' ').split(' ')
    .map(searchWord)
    .join(' AND '),
  roles: values => `role IN (${values.join(', ')})`
};

const assignmentListBuilder = {
  data: value => `_data = ${jsonToString(value)}`,
  picture: async(value, { db }) => await insertFilesOfValue(db, value)
    |> `picture_value_id = set_value(picture_value_id, ${jsonToString(value)}, ${#})`
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);

export const searchArgs = {
  keys: { type: _.List(_.Int) },
  searchText: { type: _.String },
  roles: { type: _.List(RoleEnumType) }
};
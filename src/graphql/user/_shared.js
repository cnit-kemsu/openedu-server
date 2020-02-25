import { types as _, SQLBuilder, escapePattern, _escape, jsonToString, getJSON } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';
import { buildSQLSetJSON } from '@lib/buildSQLSetJSON';
import RoleEnumType from './RoleEnumType';

const selectExprListBuilder = {
  id: 'id',
  email: 'email',
  role: 'role',
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
const mapRole = value => `'${value}'`;
const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  excludeKeys: values => values?.length > 0 ? `id NOT IN (${values.join(', ')})` : '',
  emails: values => `email IN (${values.map(email => '"' + email + '"').join(', ')})`,
  searchText: text => text
    .trim().replace(/\s{2,}/g, ' ').split(' ')
    .map(searchWord)
    .join(' AND '),
  roles: values => `role IN (${values.map(mapRole).join(', ')})`
};

const assignmentListBuilder = {
  data: ({ firstname, lastname, middlename } = {}) => `${buildSQLSetJSON('_data', {
    firstname: firstname != null ? _escape(firstname) : undefined,
    lastname: lastname != null ? _escape(lastname) : undefined,
    middlename: middlename != null ? _escape(middlename) : undefined
  })}`,
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
  excludeKeys: { type: _.List(_.Int) },
  searchText: { type: _.String },
  roles: { type: _.List(RoleEnumType) }
};
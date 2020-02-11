import { types as _, SQLBuilder, _escape, escapePattern, jsonToString } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';
import { findUser } from '@lib/authorization';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  creatorId: 'creator_id',
  creationDate: 'creation_date',
  startDate: 'start_date',
  enrollmentEndDate: 'enrollment_end_date',
  data: '_data',
  price: 'price',

  summary: 'get_value(summary_value_id)',
  description: 'get_value(description_value_id)',
  picture: 'get_value(picture_value_id)',

  sections: ['id'],
  instructors: ['id'],
  isCurrentUserEnrolled: ['id']
};

const pattern = word => `%${word}%`;
function searchWord(word) {
  return escapePattern(word, pattern)
  |> `(_name LIKE ${#})`;
}

const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  excludeKeys: values => values && values.length > 0 ? `id NOT IN (${values.join(', ')})` : '',
  searchName: text => text
    .trim().replace(/\s{2,}/g, ' ')
    .split(' ')
    .map(searchWord)
    .join(' AND '),
  async currentUserEnrolled(value, { userId, db }) {
    if (value !== true || userId == null) return null;
    const user = await findUser(userId, db);
    return `id IN (${user.courseKeys.join(', ')})`;
  },
  availableToEnroll: value => value == null ? null : `available_to_enroll = ${value}`,
  defunct: value => value == null ? null : `defunct = ${value}`
};

const assignmentListBuilder = {
  name: value => `_name = ${_escape(value)}`,
  creatorId: value => `creator_id = ${value}`,
  startDate: value => `start_date = ${_escape(value)}`,
  enrollmentEndDate: value => `enrollment_end_date = ${_escape(value)}`,
  data: value => `_data = ${jsonToString(value)}`,
  price: value => `price = ${value}`,

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
  excludeKeys: { type: _.List(_.Int) },
  searchName: { type: _.String },
  currentUserEnrolled: { type: _.Boolean },
  availableToEnroll: { type: _.Boolean },
  defunct: { type: _.Boolean }
};


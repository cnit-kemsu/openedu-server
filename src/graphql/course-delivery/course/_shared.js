import { types as _, SQLBuilder, escape, escapePattern, jsonToString } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';
import { findUser } from '@lib/authorization';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  creatorId: 'creator_id',
  startDate: 'start_date',
  enrollmentEndDate: 'enrollment_end_date',
  data: '_data',
  creationDate: 'creation_date',

  summary: 'get_value(summary_value_id)',
  description: 'get_value(description_value_id)',
  picture: 'get_value(picture_value_id)',

  sections: ['id'],
  instructors: ['id']
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
  name: value => `_name = ${escape(value)}`,
  creatorId: value => `creator_id = ${value}`,
  startDate: value => `start_date = ${escape(value)}`,
  enrollmentEndDate: value => `enrollment_end_date = ${escape(value)}`,
  data: value => `_data = ${jsonToString(value)}`,

  summary: value => `summary_value_id = set_value(summary_value_id, ${escape(value)}, NULL)`,
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
  searchName: { type: _.String },
  currentUserEnrolled: { type: _.Boolean },
  availableToEnroll: { type: _.Boolean },
  defunct: { type: _.Boolean }
};


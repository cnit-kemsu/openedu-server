import { SQLBuilder, _escape, jsonToString } from '@kemsu/graphql-server';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  comments: 'comments',

  courseKeys: `(SELECT CONCAT('[', GROUP_CONCAT(course_id SEPARATOR ','), ']') FROM access_token_course_attachments WHERE access_token_id = id)`,
  emails: `(SELECT CONCAT('[', GROUP_CONCAT('"', email, '"' SEPARATOR ','), ']') FROM access_token_user_attachments WHERE access_token_id = id)`,

  courses: ['id', 'courseKeys'],
  users: ['id', 'emails']
};

const assignmentListBuilder = {
  name: value => `_name = ${_escape(value)}`,
  comments: value => `comments = ${_escape(value)}`
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  {},
  assignmentListBuilder
);


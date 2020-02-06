import { SQLBuilder, _escape, jsonToString } from '@kemsu/graphql-server';

const selectExprListBuilder = {
  id: 'id',
  courseId: 'course_id',
  comments: 'comments',
  emails: 'emails',

  course: ['id']
};

const assignmentListBuilder = {
  courseId: value => `course_id = ${value}`,
  comments: value => `comments = ${_escape(value)}`,
  emails: value => `emails = ${jsonToString(value)}`,
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  {},
  assignmentListBuilder
);


import { SQLBuilder } from '@kemsu/graphql-server';

const aliases = {
  name: '_name',
  courseId: 'course_id'
};

const selectExprListBuilder = {
  ...aliases,

  summary: 'get_value(summary_value_id)',

  course: { courseId: 'course_id' },
  subsections: { id: 'id' }
};

const whereConditionBuilder = {
  keys(keyArray) {
    return `id IN (${keyArray})`;
  },
  courseKeys(keyArray) {
    return `course_id IN (${keyArray})`;
  }
};

const assignmentListBuilder = {
  ...aliases,
  summary(value, { isUpdateClause }) {
    return isUpdateClause
    ? ['summary_value_id = update_value(summary_value_id, ?, NULL)', value]
    : ['summary_value_id = create_value(?, NULL)', value];
  }
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);
import { SQLBuilder, escape } from '@kemsu/graphql-server';

const selectExprListBuilder = {
  name: '_name',
  courseId: 'course_id',
  sequenceNumber: 'sequence_number',

  summary: 'get_value(summary_value_id)',

  course: ['course_id'],
  subsections: ['id']
};

const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  courseKeys: values => `course_id IN (${values.join(', ')})`
};

const assignmentListBuilder = {
  name: value => `_name = ${escape(value)}`,
  
  summary: value => `summary_value_id = set_value(summary_value_id, ${escape(value)}, NULL)`
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);
import { SQLBuilder, _escape } from '@kemsu/graphql-server';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  sectionId: 'section_id',
  accessDate: 'access_date',
  expirationDate: 'expiration_date',
  sequenceNumber: 'sequence_number',

  summary: 'get_value(summary_value_id)',

  section: ['sectionId'],
  units: ['id'],
  previousSubsectionId: ['id'],
  nextSubsectionId: ['id']
};

const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  sectionKeys: values => `section_id IN (${values.join(', ')})`
};

const assignmentListBuilder = {
  name: value => `_name = ${_escape(value)}`,
  sectionId: value => `section_id = ${value}`,

  accessDate: value => `access_date = ${_escape(value)}`,
  expirationDate: value => `expiration_date = ${_escape(value)}`,

  summary: value => `summary_value_id = set_value(summary_value_id, ${_escape(value)}, NULL)`
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);
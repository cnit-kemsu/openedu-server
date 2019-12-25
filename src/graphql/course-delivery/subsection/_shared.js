import { SQLBuilder } from '@kemsu/graphql-server';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  sectionId: 'section_id',
  accessDate: 'access_date',
  expirationDate: 'expiration_date',

  summary: 'get_value(summary_value_id)',

  section: ['sectionId'],
  units: ['id'],

  previousSubsectionId: 'get_previous_subsection_delivery_id(id)',
  nextSubsectionId: 'get_next_subsection_delivery_id(id)'
};

const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  sectionKeys: values => `section_id IN (${values.join(', ')})`
};

const assignmentListBuilder = {
  name: value => `_name = ${escape(value)}`,
  sectionId: value => `section_id = ${value}`,

  accessDate: value => `access_date = ${escape(value)}`,
  expirationDate: value => `expiration_date = ${escape(value)}`,

  summary: value => `summary_value_id = set_value(summary_value_id, ${escape(value)}, NULL)`
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);
import { types as _, SQLBuilder, escape } from '@kemsu/graphql-server';

const selectExprListBuilder = {
  name: '_name',
  sectionId: 'section_id',
  accessPeriod: 'access_period',
  expirationPeriod: 'expiration_period',
  sequenceNumber: 'sequence_number',

  summary: 'get_value(summary_value_id)',

  section: ['section_id'],
  units: ['id']
};

const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  sectionKeys: values => `section_id IN (${values.join(', ')})`
};

const assignmentListBuilder = {
  name: value => `_name = ${escape(value)}`,
  sectionId: value => `section_id = ${value}`,
  
  accessPeriod: value => `access_period = ${value ? value : null}`,
  expirationPeriod: value => `expiration_period = ${value ? value : null}`,
  
  summary: value => `summary_value_id = set_value(summary_value_id, ${escape(value)}, NULL)`
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);
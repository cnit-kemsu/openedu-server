import { SQLBuilder, jsonToString, _escape } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  type: '_type',
  subsectionId: 'subsection_id',
  sequenceNumber: 'sequence_number',

  summary: 'get_value(summary_value_id)',
  data: 'get_value(data_value_id)',

  subsection: ['subsectionId']
};

const whereConditionBuilder = {
  keys: values => `id IN (${values.join(', ')})`,
  subsectionKeys: values => `subsection_id IN (${values.join(', ')})`
};

const assignmentListBuilder = {
  name: value => `_name = ${_escape(value)}`,
  type: value => `_type = ${_escape(value)}`,
  subsectionId: value => `subsection_id = ${value}`,

  summary: value => `summary_value_id = set_value(summary_value_id, ${_escape(value)}, NULL)`,
  async data(value, { db }) {
    if (value !== null && !value.timeLimit) delete value.timeLimit;
    const fileIdArray = await insertFilesOfValue(db, value);
    return `data_value_id = set_value(data_value_id, ${jsonToString(value)}, ${fileIdArray})`;
  }
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);


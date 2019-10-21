import { types as _, SQLBuilder } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';

const aliases = {
  name: '_name',
  type: '_type',
  subsectionId: 'subsection_id',
  indexNumber: 'index_number'
};

const selectExprListBuilder = {
  ...aliases,

  summary: 'get_value(summary_value_id)',
  data: 'get_value(data_value_id)',

  subsection: { subsectionId: 'subsection_id' }
};

const whereConditionBuilder = {
  keys(keyArray) {
    return `id IN (${keyArray})`;
  },
  subsectionKeys(keyArray) {
    return `subsection_id IN (${keyArray})`;
  }
};

const assignmentListBuilder = {
  ...aliases,
  summary(value, { isUpdateClause }) {
    return isUpdateClause
    ? ['summary_value_id = update_value(summary_value_id, ?, NULL)', value]
    : ['summary_value_id = create_value(?, NULL)', value];
  },
  async data(value, { db, isUpdateClause }) {
    const fileIdArray = await insertFilesOfValue(db, value);
    if (!value.timeLimit) delete value.timeLimit;
    return isUpdateClause
    ? [`data_value_id = update_value(data_value_id, ?, '${fileIdArray}')`, value]
    : [`data_value_id = create_value(?, '${fileIdArray}')`, JSON.stringify(value)];
  },
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);


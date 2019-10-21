import { types as _, SQLBuilder } from '@kemsu/graphql-server';

const aliases = {
  name: '_name',
  sectionId: 'section_id', 
};

const selectExprListBuilder = {
  ...aliases,
  accessPeriod: 'access_period',
  expirationPeriod: 'expiration_period',

  summary: 'get_value(summary_value_id)',

  section: { sectionId: 'section_id' },
  units: { id: 'id' }
};

const whereConditionBuilder = {
  keys(keyArray) {
    return `id IN (${keyArray})`;
  },
  sectionKeys(keyArray) {
    return `section_id IN (${keyArray})`;
  }
};

const assignmentListBuilder = {
  ...aliases,
  accessPeriod(value) {
    return ["access_period = ?", value ? value : null];
  },
  expirationPeriod(value) {
    return ["expiration_period = ?", value ? value : null];
  },
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
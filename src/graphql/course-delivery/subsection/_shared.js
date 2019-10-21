import { SQLBuilder } from '@kemsu/graphql-server';

const aliases = {
  name: '_name',
  sectionId: 'section_id'
};

const selectExprListBuilder = {
  ...aliases,
  accessDate: 'access_date',
  expirationDate: 'expiration_date',

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
  accessDate(value) {
    return ["access_date = ?", value ? value : null];
  },
  expirationDate(value) {
    return ["expiration_date = ?", value ? value : null];
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
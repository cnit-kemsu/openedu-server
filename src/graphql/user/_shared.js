import { types as _, SQLBuilder } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';
import { buildSQLSetJSON } from '@lib/buildSQLSetJSON';

const selectExprListBuilder = {
  verified: "CASE WHEN passkey IS NULL THEN 1 ELSE 0 END",
  firstname: "JSON_VALUE(_data, '$.firstname')",
  lastname: "JSON_VALUE(_data, '$.lastname')",
  middlename: "JSON_VALUE(_data, '$.middlename')",
  picture: "(SELECT _value FROM _values WHERE _values.id = picture_value_id)"
};

const whereConditionBuilder = {
  keys(keyArray) {
    return `id IN (${keyArray})`;
  },
  email: 'email LIKE ?',
  courseKeys(keyArray) {
    return `id IN (SELECT user_id FROM course_delivery_instructors WHERE course_delivery_instance_id IN (${keyArray}))`;
  }
};

const assignmentListBuilder = {
  data(value) {
    return buildSQLSetJSON('_data', value);
  },
  async picture(value, { db }) {
    const fileId = await insertFilesOfValue(db, value);
    return [`picture_value_id = update_value(picture_value_id, ?, '${fileId}')`, JSON.stringify(value)];
  }
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  whereConditionBuilder,
  assignmentListBuilder
);

export const searchArgs = {
  keys: { type: _.JSON },
  email: { type: _.String }
};

export const roleFilter = "role IN ('admin', 'instructor')";
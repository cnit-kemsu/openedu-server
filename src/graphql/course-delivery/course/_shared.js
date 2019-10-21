import { types as _, SQLBuilder } from '@kemsu/graphql-server';
import { insertFilesOfValue } from '@lib/insertFilesOfValue';

const aliases = {
  name: '_name',
  creatorId: 'creator_id',
  startDate: 'start_date',
  enrollmentEndDate: 'enrollment_end_date',
};

const selectExprListBuilder = {
  ...aliases,
  creationDate: 'creation_date',

  summary: 'get_value(summary_value_id)',
  description: 'get_value(description_value_id)',
  picture: 'get_value(picture_value_id)',

  sections: { id: 'id' },
  instructors: "CONCAT('[', (SELECT GROUP_CONCAT(instructors.user_id) FROM instructor_assignments instructors WHERE course_id = id), ']')",
  //available: "(enrollment_end_date > NOW() OR enrollment_end_date IS NULL)",
  enrolled({ userId }) {
    return [`is_enrolled_to_course(?, id)`, userId || null];
  },
  isAwaitPurchaseComplition({ userId }) {
    return [`is_await_purchase_completion(?, id)`, userId || null];
  }
};

const whereConditionBuilder = {
  keys(keyArray) {
    return `id IN (${keyArray})`;
  },
  name: '_name LIKE ?'
};

const assignmentListBuilder = {
  ...aliases,
  summary(value) {
    return ['summary_value_id = update_value(summary_value_id, ?, NULL)', value];
  },
  async description(value, { db }) {
    const fileIdArray = await insertFilesOfValue(db, value);
    return [`description_value_id = update_value(description_value_id, ?, '${fileIdArray}')`, value];
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
  keys: { type: _.List(_.Int) },
  name: { type: _.String }
};


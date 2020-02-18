import { SQLBuilder, _escape, jsonToString } from '@kemsu/graphql-server';
import { findLocalUser } from '@lib/authorization';

const selectExprListBuilder = {
  id: 'id',
  name: '_name',
  comments: 'comments',

  courseKeys: `(SELECT CONCAT('[', GROUP_CONCAT(course_id SEPARATOR ','), ']') FROM access_token_course_attachments WHERE access_token_id = id)`,
  emails: `(SELECT CONCAT('[', GROUP_CONCAT('"', email, '"' SEPARATOR ','), ']') FROM access_token_user_attachments WHERE access_token_id = id)`,

  courses: ['id', 'courseKeys'],
  users: ['id', 'emails']
};

const assignmentListBuilder = {
  name: value => `_name = ${_escape(value)}`,
  comments: value => `comments = ${_escape(value)}`
};

export const sqlBuilder = new SQLBuilder(
  selectExprListBuilder,
  {},
  assignmentListBuilder
);

export async function updateUsersTokensCache(tokenKey, { exclude_user_keys, include_user_keys }) {

  for (const userKey of exclude_user_keys) {
    const user = findLocalUser(userKey);
    if (user?.constructor === Promise) await user;
    if (user) user.excludeTokenKey(tokenKey);
  }

  for (const userKey of include_user_keys) {
    const user = findLocalUser(userKey);
    if (user?.constructor === Promise) await user;
    if (user) user.includeTokenKey(tokenKey);
  }
}

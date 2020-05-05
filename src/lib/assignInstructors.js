import { jsonToString } from '@kemsu/graphql-server';
import { findLocalUser } from '@lib/authorization';

export async function assignInstructors(db, courseId, instructorKeys) {
  if (instructorKeys === undefined) return 0;

  const [{ diff }] = await db.query(`SELECT set_instructor_assignments(${courseId}, ${jsonToString(instructorKeys)}) AS diff`);
  await updateUsersCache(courseId, JSON.parse(diff));

  return 1;
}

async function updateUsersCache(courseId, { exclude_user_keys, include_user_keys }) {

  for (const userKey of exclude_user_keys) {
    const user = findLocalUser(userKey);
    if (user?.constructor === Promise) await user;
    if (user) user.removeCourseKey(courseId);
  }

  for (const userKey of include_user_keys) {
    const user = findLocalUser(userKey);
    if (user?.constructor === Promise) await user;
    if (user) user.pushCourseKey(courseId);
  }
}


// export async function assignInstructors(db, courseId, instructorKeys) {
//   if (instructorKeys === undefined) return 0;
//   if (instructorKeys === null || instructorKeys.length === 0) {
//     return await db.query(`DELETE FROM instructor_assignments WHERE course_id = ${courseId}`)
//     |> #.affectedRows;
//   }

//   const values = [];
//   for (const userId of instructorKeys) {
//     values.push(`(${courseId}, ${userId}, TRUE)`);
//   }
//   await db.query(`DELETE FROM instructor_assignments WHERE course_id = ${courseId} AND user_id NOT IN (${instructorKeys.join(', ')})`);
//   return await db.query(`INSERT INTO instructor_assignments (course_id, user_id, accepted) VALUES ${values.join(', ')} ON DUPLICATE KEY UPDATE course_id = ${courseId}`)
//   |> #.affectedRows;
// }
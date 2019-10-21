export async function assignInstructors(courseId, instructorKeys, db) {
  if (!instructorKeys) return 0;

  const values = [];
  const params = [];
  for (const userId of instructorKeys) {
    values.push('(?, ?, ?)');
    params.push(courseId, userId, true);
  }
  await db.query(`DELETE FROM instructor_assignments WHERE course_id = ?`, courseId);
  if (instructorKeys.length !== 0) await db.query(`INSERT INTO instructor_assignments (course_id, user_id, accepted) VALUES ${values.join(', ')}`, params);
  return 1;
}
export async function assignInstructors(db, courseId, instructorKeys) {
  if (instructorKeys === undefined) return 0;
  if (instructorKeys === null || instructorKeys.length === 0) {
    return await db.query(`DELETE FROM instructor_assignments WHERE course_id = ${courseId}`)
    |> #.affectedRows;
  }

  const values = [];
  for (const userId of instructorKeys) {
    values.push(`(${courseId}, ${userId}, TRUE)`);
  }
  await db.query(`DELETE FROM instructor_assignments WHERE course_id = ${courseId} AND user_id NOT IN (${instructorKeys.join(', ')})`);
  return await db.query(`INSERT INTO instructor_assignments (course_id, user_id, accepted) VALUES ${values.join(', ')} ON DUPLICATE KEY UPDATE course_id = ${courseId}`)
  |> #.affectedRows;
}
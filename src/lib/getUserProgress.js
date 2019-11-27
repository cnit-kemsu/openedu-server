export async function getUserProgress(db, courseId, userId) {

  const res = await db.query(`
    SELECT _course_delivery_units._name unitName, _course_delivery_units.quiz, _quiz_attempts.score FROM (
      SELECT id, _name, (SELECT _value FROM _values WHERE id = data_value_id) quiz FROM course_delivery_units WHERE subsection_id IN (
        SELECT id FROM course_delivery_subsections WHERE section_id IN (
          SELECT id FROM course_delivery_sections WHERE course_id = ?
        )
      ) AND _type = 'quiz' 
    ) _course_delivery_units LEFT OUTER JOIN (
      SELECT unit_id, score FROM quiz_attempts WHERE user_id = ?
    ) _quiz_attempts ON _course_delivery_units.id = _quiz_attempts.unit_id
  `, [courseId, userId]);

  let certificateAvailable = true;

  if (res) for (const _res of res) {
    if (_res?.quiz) _res.quiz = JSON.parse(_res.quiz);
    if (_res?.quiz?.questions) delete _res.quiz.questions;
    if (!_res?.score) certificateAvailable = false;
  }

  return {
    units: res,
    certificateAvailable
  };
}
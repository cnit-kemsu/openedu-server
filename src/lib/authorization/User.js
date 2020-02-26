import { CachedValue } from './Caching';

function finalizeAttempt(a) {
  if (a.lastSubmittedReply !== null) a.lastSubmittedReply = JSON.parse(a.lastSubmittedReply);
  if (a.feedback !== null) a.feedback = JSON.parse(a.feedback);
  const { unitName, quizData: [finalCertification, maxScore] } = JSON.parse(a.data);
  delete a.data;
  a.unitName = unitName;
  a.finalCertification = finalCertification;
  //a.maxScore = maxScore;
}

const tokens = new Map();

async function updateTokens(requiredKeys, db) {
  const existedKeys = [...tokens.keys()];
  const loadKeys = requiredKeys.filter(key => !existedKeys.includes(key));
  if (loadKeys.length === 0) return;
  const _tokens = await db.query(`
    SELECT access_token_id, CONCAT('[', GROUP_CONCAT(course_id SEPARATOR ', '), ']') AS course_keys
    FROM access_token_course_attachments
    WHERE access_token_id IN (${loadKeys.join(', ')})
    GROUP BY access_token_id;
  `);
  for (const { access_token_id: tokenKey, course_keys } of _tokens) if (!tokens.has(tokenKey)) tokens.set(tokenKey, JSON.parse(course_keys));
}

export function updateToken(key, courseKeys) {
  tokens.set(key, courseKeys);
}

export function deleteToken(key) {
  tokens.set(key, []);
}

export default class User extends CachedValue {

  async resolve(db) {

    const [user] = await db.query(`SELECT role, email, _data AS data FROM users WHERE id = ${this.key}`);
    if (user === undefined) return;
    if (user.data !== null) user.data = JSON.parse(user.data);

    let courses = [];
    if (user.role === 'student') {

      courses = await db.query(`
        (SELECT course_id \`key\` FROM free_course_enrollments WHERE user_id = ${this.key})
        UNION ALL
        (SELECT course_id \`key\` FROM paid_course_purchases WHERE user_id = ${this.key} AND callback_status = 'success')
      `);

      user.quizAttempts = await db.query(`
        SELECT
          (SELECT CONCAT('{ "unitName": "', _name, '", "quizData": ', JSON_EXTRACT(get_value(data_value_id), '$.finalCertification', '$.maxScore'), '}') FROM course_delivery_units WHERE id = unit_id) AS data,
          unit_id unitId,
          start_date startDate,
          last_submitted_reply lastSubmittedReply,
          replies_count repliesCount,
          score,
          feedback
        FROM quiz_attempts
        WHERE user_id = ${this.key}
      `);
      user.quizAttempts?.forEach(finalizeAttempt);

      // const tokens = await db.query(`
      //   SELECT atca.access_token_id AS access_token_id, CONCAT('[', GROUP_CONCAT(atca.course_id SEPARATOR ', '), ']') AS course_keys
      //   FROM access_token_user_attachments AS atua
      //     JOIN access_token_course_attachments AS atca
      //     ON atua.access_token_id = atca.access_token_id
      //   WHERE atua.user_id = 4
      //   GROUP BY atca.access_token_id;
      // `);
      // if (tokens.length > 0) {
      //   this.tokens = new Map();
      //   for (const token of tokens) this.tokens.set(token.access_token_id, JSON.parse(token.course_keys));
      // }
      this.tokenKeys = await db.query(`
        SELECT access_token_id FROM access_token_user_attachments WHERE user_id = 4;
      `) |> #.map(({ access_token_id }) => access_token_id);
      if (this.tokenKeys.length > 0) await updateTokens(this.tokenKeys, db);

    } else if (user.role === 'instructor' || user.role === 'admin') {
      courses = await db.query(`SELECT course_id \`key\` FROM instructor_assignments WHERE user_id = ${this.key}`);
    }
    if (courses !== undefined) user.courseKeys = courses.map(c => c.key);
    
    user.id = this.key;
    this.props = user;
    Object.assign(this, user);
    return this;
  }

  hasCourseKey(courseId) {
    if (this.courseKeys.includes(courseId)) return true;
    if (this.tokenKeys) for (const tokenKey of this.tokenKeys) {
      if (tokens.has(tokenKey)
        && tokens.get(tokenKey).includes(courseId)
      ) return true;
    }
    return false;
  }

  get allCourseKeys() {
    const courseKeys = [...this.courseKeys];
    if (this.tokenKeys) for (const tokenKey of this.tokenKeys) {
      if (tokens.has(tokenKey)) courseKeys.push(...tokens.get(tokenKey));
    }
    return courseKeys;
  }

  pushCourseKey(courseId) {
    this.courseKeys.push(courseId);
  }

  excludeTokenKey(key) {
    this.tokenKeys.splice(this.tokenKeys.indexOf(key), 1);
  }

  includeTokenKey(key) {
    this.tokenKeys.push(key);
  }

  hasQuizAttempt(unitId) {
    const quizAttempt = this.quizAttempts.find(a => a.unitId === unitId);
    return quizAttempt != null;
  }

  getQuizAttempt(unitId) {
    return this.quizAttempts.find(a => a.unitId === unitId);
  }

  deleteQuizAttempt(unitId) {
    this.quizAttempts.splice(this.quizAttempts.findIndex(a => a.unitId === unitId), 1);
  }

  pushQuizAttempt(unitId, dataValueId, startDate) {
    this.quizAttempts.push({ unitId, dataValueId, startDate, repliesCount: 0 });
  }

  updateQuizAttempt(unitId, data) {
    const attempt = this.getQuizAttempt(unitId);
    Object.assign(attempt, data);
  }

}


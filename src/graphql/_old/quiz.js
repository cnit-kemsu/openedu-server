import { types as _, authorize, PublicError, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { resolveDate } from './_shared';

export const AuthTokenType = new _.Object({
  name: 'AuthToken',
  fields: {
    role: { type: new _.NonNull(_.String) },
    verified: { type: new _.NonNull(_.Boolean) },
    complete: { type: new _.NonNull(_.Boolean) },
    bearer: { type: new _.NonNull(_.String) },
    picture: { type: _.JSON }
  }
});

const startQuizAttempt = {
  type: new _.NonNull(_.Int),
  args: {
    courseDeliveryUnitId: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { courseDeliveryUnitId }, { db, user }) {
    authorize(user);

    const [subsection] = await db.query(`
      SELECT access_date accessDate, expiration_date expirationDate FROM course_delivery_subsections WHERE id = (
        SELECT subsection_id FROM course_delivery_units WHERE id = ?
      )
    `, courseDeliveryUnitId);
    if (subsection) {
      const nowDate = new Date();
      if (subsection.accessDate && subsection.accessDate > nowDate) throw new GraphQLError("Unit subsection access not started");
      if (subsection.expirationDate && subsection.expirationDate < nowDate) throw new GraphQLError("Unit subsection access time expired");
    }

    await db.query('CALL start_quiz_attempt(?, ?)', [user.id, courseDeliveryUnitId]);
    return 1;
  }
};

const makeQuizAttempt = {
  type: new _.NonNull(_.Int),
  args: {
    courseDeliveryUnitId: { type: new _.NonNull(_.Int) },
    result: { type: _.JSON }
  },
  async resolve(obj, { courseDeliveryUnitId, result }, { db, user }) {
    authorize(user);

    const [subsection] = await db.query(`
      SELECT access_date accessDate, expiration_date expirationDate FROM course_delivery_subsections WHERE id = (
        SELECT subsection_id FROM course_delivery_units WHERE id = ?
      )
    `, courseDeliveryUnitId);
    if (subsection) {
      const nowDate = new Date();
      if (subsection.accessDate && subsection.accessDate > nowDate) throw new GraphQLError("Unit subsection access not started");
      if (subsection.expirationDate && subsection.expirationDate < nowDate) throw new GraphQLError("Unit subsection access time expired");
    }

    const [{ quiz, count, started }] = await db.query('SELECT _count count, (SELECT _value FROM _values WHERE id = data_value_id) quiz, started FROM quiz_attempts WHERE user_id = ? AND course_delivery_unit_id = ?', [user.id, courseDeliveryUnitId]);
    const _quiz = JSON.parse(quiz);

    if (count >= _quiz.totalAttempts) throw new GraphQLError("Attempts count exceed");
    if (_quiz.timeLimit) {
      const _nowDate = new Date();
      const allowDate = new Date(started.getTime() + _quiz.timeLimit*60000);
      if (_nowDate > allowDate) throw new GraphQLError("Time limit exceed");
    }

    
    let totalScore = 0;
    const _result = [];
    for (const questionIndex in _quiz.questions) {

      const quiestion = _quiz.questions[questionIndex];
      _result.push([]);
      let totalRightAnswers = 0;
      let rightAnswers = 0;
      for (const answerOptionIndex in quiestion.answerOptions) {

        const answerOption = quiestion.answerOptions[answerOptionIndex];
        const answer = result.questions[questionIndex].answerOptions[answerOptionIndex];
        if (answerOption.correct) totalRightAnswers++;
        if (answerOption.correct && answer.markAsCorrect) rightAnswers++;
        else if (!answerOption.correct && answer.markAsCorrect) rightAnswers--;
        if (answer.markAsCorrect) _result[questionIndex].push(true);
        else _result[questionIndex].push(false); 
      }
      totalScore += rightAnswers > 0 ? (rightAnswers / totalRightAnswers) : 0;
    }
    const score = Math.floor(100 * totalScore / _quiz.questions.length);

    await db.query('CALL make_quiz_attempt(?, ?, ?, ?)', [user.id, courseDeliveryUnitId, JSON.stringify(_result), score]);

    return 1;
  }
};

// const quizAttempt = {
//   type: _.JSON,
//   args: {
//     courseDeliveryUnitId: { type: new _.NonNull(_.Int) }
//   },
//   async resolve(obj, { courseDeliveryUnitId }, { db, user }) {
//     authorize(user);

//     const [{ quiz, result, score }] = await db.query('SELECT result, score, (SELECT _value FROM _values WHERE id = data_value_id) quiz FROM quiz_attempts WHERE user_id = ? AND course_delivery_unit_id = ?', [user.id, courseDeliveryUnitId]);
//     const _result = result ? JSON.parse(result) : null;
//     const _quiz = JSON.parse(quiz);

//     for (const questionIndex in _quiz.questions) {
//       const quiestion = _quiz.questions[questionIndex];

//       for (const answerOptionIndex in quiestion.answerOptions) {

//         const answerOption = quiestion.answerOptions[answerOptionIndex];

//         if (_result) {
//           const answer = _result.answerOptions[answerOptionIndex];
//           answerOption.markAsCorrect = answer.markAsCorrect;
//           if (answerOption.correct === answer.markAsCorrect) answer.markedCorrectly = true;
//           else answer.markedCorrectly = false;
//         }

//         delete answerOption.correct;
//       }
//     }
//     return {
//       _quiz,
//       score
//     };
//   }
// };

export async function getQuizAttempt(db, courseDeliveryUnitId, userId) {

  const [attempt] = await db.query('SELECT result, score, _count count, started, (SELECT _value FROM _values WHERE id = data_value_id) quiz FROM quiz_attempts WHERE user_id = ? AND course_delivery_unit_id = ?', [userId, courseDeliveryUnitId]);
  if (!attempt) return null;

  const { quiz, result, score, count, started } = attempt;
  const _result = result ? JSON.parse(result) : null;
  const _quiz = JSON.parse(quiz);

  for (const questionIndex in _quiz.questions) {
    const quiestion = _quiz.questions[questionIndex];

    for (const answerOptionIndex in quiestion.answerOptions) {

      const answerOption = quiestion.answerOptions[answerOptionIndex];

      if (_result) {
        const answer_markAsCorrect = _result[questionIndex][answerOptionIndex];
        answerOption.markAsCorrect = answer_markAsCorrect;
        if (answer_markAsCorrect) {
          if (answerOption.correct === answer_markAsCorrect) answerOption.markedCorrectly = true;
          else answerOption.markedCorrectly = false;
        }
      }

      delete answerOption.correct;
    }
  }
  return {
    questions: _quiz.questions,
    totalAttempts: _quiz.totalAttempts,
    maxScore: _quiz.maxScore,
    timeLimit: _quiz.timeLimit,
    score,
    count,
    started: resolveDate(started)
  };
}

export default [{
  //quizAttempt
}, {
  startQuizAttempt,
  makeQuizAttempt
}];
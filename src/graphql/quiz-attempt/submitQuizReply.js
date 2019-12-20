import { types as _, GraphQLError } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';

export default {
  type: _.JSON,
  args: {
    unitId: { type: _.NonNull(_.Int) },
    reply: { type: _.JSON }
  },
  async resolve(obj, { unitId, reply }, { db, user }) {
    verifySignedIn(user);

    const [attempt] = await db.query(
      `SELECT get_value(data_value_id) quiz, start_date startDate, replies_count repliesCount, feedback FROM quiz_attempts WHERE user_id = ${user.id} AND unit_id = ${unitId}`
    );
    if (attempt === undefined) throw new GraphQLError("Quiz attempt has not yet been started");

    const { totalAttempts, timeLimit, questions, maxScore } = JSON.parse(attempt.quiz);
    const { startDate, repliesCount } = attempt;

    if (repliesCount >= totalAttempts) throw new GraphQLError("The number of replies submitted to the quiz exceeds the limit");
    if (timeLimit) {
      const permittedDate = new Date(startDate.getTime() + timeLimit*60000);
      if (new Date() > permittedDate) throw new GraphQLError("Time to submit a reply to the quiz has expired");
    }

    let totalScore = 0;
    const feedback = attempt.feedback ? JSON.parse(attempt.feedback) : [];

    try {

      for (const questionIndex in questions) {

        const question = questions[questionIndex];
        const answer = reply[questionIndex];
  
        if (question.type === 'MultipleChoice') {
  
          if (!feedback[questionIndex]) feedback[questionIndex] = [];
          const answerOptions = question.answerOptions;
          let totalCorrectOptions = 0;
          let totalCorrectlyMarkedOptions = 0;
          let totalIncorrectlyMarkedOptions = 0;
          for (const option of answerOptions) if (option.correct) totalCorrectOptions++;
          for (const optionIndex of answer) {
            if (answerOptions[optionIndex].correct) {
              totalCorrectlyMarkedOptions++;
              feedback[questionIndex][optionIndex] = true;
            }
            else {
              totalIncorrectlyMarkedOptions++;
              feedback[questionIndex][optionIndex] = false;
            }
          }
          const diff = totalCorrectlyMarkedOptions - totalIncorrectlyMarkedOptions;
          if (diff > 0) totalScore += diff / totalCorrectOptions;
        }
      }
      
    } catch (error) {
      throw new GraphQLError("Invalid reply format");
    }

    const score = Math.floor(maxScore * totalScore / questions.length);

    try {

      await db.query(`CALL submit_quiz_reply(${user.id}, ${unitId}, ${JSON.stringify(reply)}, ${score}, ${JSON.stringify(feedback)})`);

    } catch (error) {

      if (error.rootCause?.message === 'invalid role') throw new GraphQLError(`User with role '${user.role}' cannot submit quiz reply. Only users with role 'student' are able to submit quiz reply`);
      if (error.rootCause?.message === 'not enrolled') throw new GraphQLError("You are not enrolled in the course containing the quiz");
      if (error.rootCause?.message === 'access closed') throw new GraphQLError("Access to the subsection containing the quiz has not yet been opened");
      if (error.rootCause?.message === 'access expired') throw new GraphQLError("Access to the subsection containing the quiz has expired");

      throw error;
      
    }

    return feedback;
  }
};
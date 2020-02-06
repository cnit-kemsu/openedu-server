import { types as _, GraphQLError, jsonToString } from '@kemsu/graphql-server';
import { findUser, findUnit } from '@lib/authorization';

export default {
  type: _.JSON,
  args: {
    unitId: { type: _.NonNull(_.Int) },
    reply: { type: _.JSON }
  },
  async resolve(obj, { unitId, reply }, { userId, db }) {
    const user = await findUser(userId, db);
    if (user.role !== 'student') throw new GraphQLError(`User with role '${user.role}' cannot submit quiz reply. Only users with role 'student' are able to submit quiz reply`);

    const attempt = user.getQuizAttempt(unitId);
    if (attempt === undefined) throw new GraphQLError(`Quiz attempt has not yet been started`);
    attempt.startDate = new Date(attempt.startDate);

    const unit = await findUnit(unitId, db);
    if (unit.type !== 'quiz') throw new GraphQLError(`The unit is not of type 'quiz'`);

    const subsection = await unit.getSubsection(db);
    if (!user.hasCourseKey(subsection.courseId)) throw new GraphQLError(`You are not enrolled in the course containing the quiz`);
    if (!subsection.isAccessible(db)) throw new GraphQLError(`Access to the subsection containing the quiz has not yet been opened`);
    if (subsection.isExpired(db)) throw new GraphQLError(`Access to the subsection containing the quiz has expired`);

    const { totalAttempts, timeLimit, questions, maxScore } = unit.data;
    const { startDate, repliesCount } = attempt;

    if (repliesCount >= totalAttempts) throw new GraphQLError(`The number of replies submitted to the quiz exceeds the limit`);
    if (timeLimit) {
      const permittedDate = new Date(startDate.getTime() + timeLimit*60000);
      if (new Date() > permittedDate) throw new GraphQLError(`Time to submit a reply to the quiz has expired`);
    }

    let totalScore = 0;
    const feedback = attempt.feedback || [];

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

        } else if (question.type === 'SingleChoice') {
  
          if (!feedback[questionIndex]) feedback[questionIndex] = [];
          const correctAnswerIndex = question.correctAnswerIndex;
          
          if (answer === correctAnswerIndex) {
            totalScore++;
            feedback[questionIndex][answer] = true;
          } else {
            feedback[questionIndex][answer] = false;
          }

        }


      }
      
    } catch (error) {
      throw new GraphQLError(`Invalid reply format`);
    }

    const score = Math.floor(maxScore * totalScore / questions.length);

    await db.query(`CALL submit_quiz_reply(${userId}, ${unitId}, ${jsonToString(reply)}, ${score}, ${jsonToString(feedback)})`);
    user.updateQuizAttempt(unitId, { lastSubmittedReply: reply, score, feedback, repliesCount: repliesCount + 1 });
    return feedback;
  }
};
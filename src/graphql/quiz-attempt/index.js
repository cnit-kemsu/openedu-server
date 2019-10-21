import quizAttempt from './quizAttempt';
import createQuizAttempt from './createQuizAttempt';
import submitQuizReply from './submitQuizReply';

export default {
  query: {
    quizAttempt
  },
  mutation: {
    createQuizAttempt,
    submitQuizReply
  }
};
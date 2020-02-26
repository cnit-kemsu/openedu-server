import quizAttempt from './quizAttempt';
import createQuizAttempt from './createQuizAttempt';
import submitQuizReply from './submitQuizReply';
import deleteQuizAttempt from './deleteQuizAttempt';

export default {
  query: {
    quizAttempt
  },
  mutation: {
    createQuizAttempt,
    submitQuizReply,
    deleteQuizAttempt
  }
};
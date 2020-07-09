import { compose } from '@kemsu/graphql-server';

import account from './account';
import user from './user';
import courseDesign from './course-design';
import courseDelivery from './course-delivery';
import quizAttempt from './quiz-attempt';
import payment from './payment';
import passTokens from './pass-tokens';

export const { schema, loaders } = compose(
  account,
  user,
  courseDelivery,
  courseDesign,
  quizAttempt,
  payment,
  passTokens
);
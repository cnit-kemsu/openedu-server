import { compose } from '@kemsu/graphql-server';
// import account from './account';
// import users from './users';
// import students from './students';
// import courseDesignTemplates from './courseDesignTemplates';
// import courseDesignSections from './courseDesignSections';
// import courseDesignSubsections from './courseDesignSubsections';
// import courseDesignUnits from './courseDesignUnits';
// import courseDeliveryInstances from './courseDeliveryInstances';
// import courseDeliverySections from './courseDeliverySections';
// import courseDeliverySubsections from './courseDeliverySubsections';
// import courseDeliveryUnits from './courseDeliveryUnits';
// import quiz from './quiz';

import account from './account';
import user from './user';
import courseDesign from './course-design';
import courseDelivery from './course-delivery';
import quizAttempt from './quiz-attempt';
import payment from './payment';

export const { schema, loaders } = compose(
  account,
  user,
  courseDelivery,
  courseDesign,
  quizAttempt,
  payment
  
  // account,
  // users,
  // students,
  // courseDesignTemplates,
  // courseDesignSections,
  // courseDesignSubsections,
  // courseDesignUnits,
  // courseDeliveryInstances,
  // courseDeliverySections,
  // courseDeliverySubsections,
  // courseDeliveryUnits,
  // quiz
);

// export const { schema, loaders } = compose([
//   courseDesign
//   // account,
//   // users,
//   // students,
//   // courseDesignTemplates,
//   // courseDesignSections,
//   // courseDesignSubsections,
//   // courseDesignUnits,
//   // courseDeliveryInstances,
//   // courseDeliverySections,
//   // courseDeliverySubsections,
//   // courseDeliveryUnits,
//   // quiz
// ], [
//   //CourseType,
//   //SectionType
// ]);
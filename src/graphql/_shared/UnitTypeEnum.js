import { types as _ } from '@kemsu/graphql-server';

export default _.EnumType({
  name: 'UnitTypeEnum',
  values: {
    DOCUMENT: { value: 'document' },
    FILE_DOCUMENT: { value: 'file-document' },
    VIDEO: { value: 'video' },
    QUIZ: { value: 'quiz' }
  }
});

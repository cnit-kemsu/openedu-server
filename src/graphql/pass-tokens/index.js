import allPassTokens from './allTokens';
import totalPassTokens from './totalTokens';
import passToken from './token';

import createPassToken from './createToken';
import deletePassToken from './deleteToken';
import updatePassToken from './updateToken';

export default {
  query: {
    allPassTokens,
    totalPassTokens,
    passToken
  },
  mutation: {
    createPassToken,
    deletePassToken,
    updatePassToken,
  }
};
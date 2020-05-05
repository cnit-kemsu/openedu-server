import signIntoAccount from './signIntoAccount';
import signUpAccount from './signUpAccount';
import verifyAccount from './verifyAccount';
import confirmAccount from './confirmAccount';
import completeAccount from './completeAccount';
import resetPasswordToken from './ResetPasswordToken';
import resetPassword from './ResetPassword';

export default {
  mutation: {
    signIntoAccount,
    signUpAccount,
    verifyAccount,
    confirmAccount,
    completeAccount,
    resetPasswordToken,
    resetPassword
  }
};
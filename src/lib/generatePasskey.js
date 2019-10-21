import crypto from 'crypto';

export function generatePasskey(email) {
  return crypto.randomBytes(10)
  |> crypto.createHmac('sha1', #)
    .update(email)
    .digest('hex')
    .substring(0, 20);
}
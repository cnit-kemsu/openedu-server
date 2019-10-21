import crypto from 'crypto';
import { authorize, GraphQLError } from '@kemsu/graphql-server';

export function generatePasskey(email) {
  return crypto.randomBytes(10)
  |> crypto.createHmac('sha1', #)
    .update(email)
    .digest('hex')
    .substring(0, 20);
}

export function authorizeCourseAdmin(user) {
  authorize(user);
  if (!['superuser', 'admin', 'instructor'].includes(user.role)) throw new GraphQLError(
    "You don't have enough permission to perform this operation"
  );
}

export function nowDate() {
  return new Date() |>
  #.toISOString().substring(0, 10) + ' ' + #.toTimeString().substring(0, 8);
}

export function resolveDate(date) {
  return new Date(date)
  |> (#.toLocaleDateString('ru').split('.') |> #.reverse().join('-'))
    + ' ' + #.toLocaleTimeString('ru');
  // |> (#.toLocaleDateString().split('/') |> [#[2], #[0], #[1]].join('-'))
  //   + ' ' + #.toTimeString().substring(0, 8);
}

function numToLocStr(value) {
  return value.toLocaleString('en', { minimumIntegerDigits: 2 });
}

export function resolveTime(time) {
  return time.split(':')
  |> (Math.floor(#[0] / 24) |> numToLocStr)
    + ' ' + [
      numToLocStr(#[0] % 24),
      numToLocStr(#[1])
    ].join(':');
}
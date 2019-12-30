import { dateToString } from '@kemsu/graphql-server';

export function resolveDate(date) {
  if (!date) return null;
  return new Date(date)
  |> dateToString;
}
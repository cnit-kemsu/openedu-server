export function resolveDate(date) {
  if (!date) return null;
  return new Date(date)
  |> (#.toLocaleDateString('ru').split('.') |> #.reverse().join('-'))
    + ' ' + #.toLocaleTimeString('ru');
}
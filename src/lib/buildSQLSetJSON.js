export function buildSQLSetJSON(columnName, _jsonValue) {
  
  const jsonValue = {};
  for (const key in _jsonValue) {
    if (_jsonValue[key] !== undefined) jsonValue[key] = _jsonValue[key];
  }
  const keys = Object.keys(jsonValue);
  if (keys.length === 0) return;

  let _values = '';
  //const _params = [];
  for (const key of keys) {
    if (jsonValue[key] !== undefined) {
      _values += `, '$.${key}', ${jsonValue[key]}`;
      //_params.push(jsonValue[key]);
    }
  }

  return `${columnName} = JSON_SET(IF(${columnName} IS NULL, '{}', ${columnName})${_values})`;
}
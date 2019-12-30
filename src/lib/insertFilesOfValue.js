import { FileInsert } from '@kemsu/graphql-server';

function collectFilesOfValue(value, files = []) {
  if (value instanceof FileInsert) value.pushToStore(files);
  else if (value instanceof Object) for (const key in value) collectFilesOfValue(value[key], files);
  return files;
}

function replaceFilesOfValueWithSourceKeys(value, insertIdArray) {
  if (value instanceof Object && !(value instanceof FileInsert)) for (const key in value) {
    if (value[key] instanceof FileInsert) {
      value.fileSourceKey = value[key].getInsertId(insertIdArray);
      delete value[key];
    } else if (value[key] instanceof Object) replaceFilesOfValueWithSourceKeys(value[key], insertIdArray);
  }
}

function collectFileSourceKeysOfValue(value, fileIdArray = []) {
  if (value instanceof Object && !(value instanceof FileInsert)) for (const key in value) {
    if (key === 'fileSourceKey') fileIdArray.push(value[key]);
    else if (value[key] instanceof Object && !(value instanceof FileInsert)) collectFileSourceKeysOfValue(value[key], fileIdArray);
  }
  return fileIdArray;
}

export async function insertFilesOfValue(db, value) {
  if (value === null) return null;
  
  const files = collectFilesOfValue(value);
  const insertIdArray = [];

  if (files.length > 0) {

    const params = [];
    let values = '';
    for (const file of files) {
      values+='(?, ?), ';
      params.push(file.mimetype, file.buffer);
    }
    values = values.slice(0, -2);

    const { affectedRows, insertId } = await db.query(`INSERT INTO files (mimetype, _buffer) VALUES ${values}`, params);

    for (let index = 0; index < affectedRows; index++) insertIdArray.push(insertId + index);
  }
  
  replaceFilesOfValueWithSourceKeys(value, insertIdArray);
  const fileIdArray = collectFileSourceKeysOfValue(value);
  return fileIdArray.join(',') |> `'[${#}]'`;
}
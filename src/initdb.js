//import path from 'path';
//import fs from 'fs';
import mariadb from 'mariadb';
import { hashPassword } from '@kemsu/graphql-server';
const config = require('../config');

//import { dbConfig, superUser } from './config';

// const dbSchema = path.resolve(__dirname, './schema.sql')
//   |> fs.readFileSync(#).toString();
  
// const pool = mariadb.createPool({
//   ...dbConfig,
//   database: undefined,
//   multipleStatements: true
// });

const pool = mariadb.createPool({
  ...config.dbConfig,
  database: 'openedu',
  multipleStatements: true
});

async function initdb() {

  let db;
  try {

    db = await pool.getConnection();
    // await db.query(dbSchema + `
    //   INSERT INTO users (role, email, pwdhash, _data) values (?, ?, ?, "")
    // `, [
    //   'superuser',
    //   superUser.email || '',
    //   hashPassword(superUser.password)
    // ]);
    await db.query(`
      INSERT INTO users (role, email, pwdhash, _data) values (?, ?, ?, NULL)
    `, [
      'superuser',
      config.superUser.email || '',
      hashPassword(config.superUser.password)
    ]);

  } catch (error) {
    console.error(error);
  } finally {
    db.end();
    process.exit();
  }
}

initdb();



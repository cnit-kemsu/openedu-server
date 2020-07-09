import mariadb from 'mariadb';
import { hashPassword } from '@kemsu/graphql-server';
const config = require('./config');

const pool = mariadb.createPool({
  ...config.dbConfig,
  database: 'openedu',
  multipleStatements: true
});

async function initdb() {

  let db;
  try {

    db = await pool.getConnection();
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



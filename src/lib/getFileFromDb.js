import { pool } from './dbPool';

export async function getFileFromDb(req, res, next) {

  const fileId = req.params.fileId;
  const db = await pool.getConnection();
  try {
    const [{ mimetype, buffer }] = await db.query(`SELECT mimetype, _buffer buffer FROM files WHERE id = ?`, fileId);
    res.contentType(mimetype);
    res.end(buffer, 'binary');
  } finally {
    if (db !== undefined) db.end();
    next();
  }
}
import express from 'express';
import { graphqlResolver, userInfo, handleUncaughtErrors, errorLogger } from '@kemsu/graphql-server';
import { jwtSecret, sitename, url } from '../config';
import { schema, loaders } from './graphql';
import path from 'path';
import bodyParser from 'body-parser';
import { pool } from '@lib/dbPool';
import { paymentCallback } from '@lib/paymentCallback';
import { getFileFromDb } from '@lib/getFileFromDb';
import { sendSertificate } from '@lib/sendSertificate';

import multer from 'multer';
const upload = multer();

if (process.env.NODE_ENV !== 'production') process.env.NODE_ENV = 'development';
if (process.env.PORT === undefined) process.env.PORT = 443;

if (process.env.NODE_ENV === 'production') handleUncaughtErrors();

const app = express();

bodyParser.json() |> app.use;
//bodyParser.urlencoded({ extended: true }) |>app.use;

path.resolve('./public') |> express.static |> app.use;

userInfo(jwtSecret) |> app.use(#);

// console.log(sitename);
// console.log(url);

async function graphqlOptions({ _user }) {
  const db = await pool.getConnection();
  return [{
    userId: _user?.id || _user?.userId,
    db
  }, function() {
    if (db !== undefined) db.end();
  }];
}
graphqlResolver(schema, loaders, graphqlOptions)
|> app.use('/graphql', upload.any(), #);

app.get('/files/:fileId', getFileFromDb);

app.post('/payment-callback', paymentCallback);

app.post('/send-sertificate/:userId/:courseId', sendSertificate);

if (process.env.NODE_ENV === 'production') app.get('/*', function(req, res) { 
  if (!res.headersSent) {
    const _path = path.resolve('./public/index.html');
    res.sendFile(_path);
  }
});

app.use(errorLogger);

app.listen(process.env.PORT);
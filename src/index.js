import express from 'express';
import { graphqlResolver, userInfo, handleUncaughtErrors, errorLogger, Pool } from '@kemsu/graphql-server';
import { dbConfig, jwtSecret, sitename, url } from './config';
import { schema, loaders } from './graphql';
import path from 'path';
import bodyParser from 'body-parser';
import pdf from 'html-pdf';
import { sendEmail } from './sendEmail';
import { toWrittenAmount } from '@lib/toWrittenAmount';

import multer from 'multer';
const upload = multer();

if (process.env.NODE_ENV !== 'production') process.env.NODE_ENV = 'development';
if (process.env.PORT === undefined) process.env.PORT = 443;

if (process.env.NODE_ENV === 'production') handleUncaughtErrors();

const app = express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//   extended: true
// })); 

app.use(express.static( path.resolve('./public') ) );

userInfo(jwtSecret)
  |> app.use(#);

const pool = new Pool(dbConfig);
async function graphqlOptions({ user }) {
  const db = await pool.getConnection();
  return [{
    user,
    db
  }, function() {
    if (db !== undefined) db.end();
  }];
}
graphqlResolver(schema, loaders, graphqlOptions)
|> app.use('/graphql', upload.any(), #);

app.get('/files/:fileId', async function getFileFromDb(req, res, next) {

  const fileId = req.params.fileId;
  const db = await pool.getConnection();
  try {
    const [{ mimetype, buffer }] = await db.query(`SELECT mimetype, _buffer buffer FROM files WHERE id = ?`, fileId);
    res.contentType(mimetype);
    res.end(buffer, 'binary');
    //res.writeHead(200, {'Content-Type': mimetype });
    //res.end(buffer, 'binary');
  } finally {
    if (db !== undefined) db.end();
    next();
  }
});

app.post('/payment-callback', async function paymentCallback(req, res, next) {

  const db = await pool.getConnection();

  try {
    const info = req.body;
    const status = info.status.type === 'success' ? 'success' : 'failed';
    await db.query('UPDATE paid_course_purchases SET callback_status = ?, callback_info = ?, callback_date = ? WHERE order_id = ?', [status, info, new Date(), info.order_id]);
    const { user, course } = JSON.parse(info.additional_info);

    const { trans_date, order_id, ref_set: { auth_code, ret_ref_number }, source_card: { masked_number }, amount: { value } } = info;
    const pdfContent = `
      <html>
        <head>
        <style>
          body {
            font-family: Tahoma;
            padding: 40px;
          }
          hr {
            border: 1px dashed black;
            margin: 20px;
          }
        </style>
        <body>

          <div style="font-size: 20px; text-align: center">Безналичная оплата услуг</div>

          <hr />

          <div>Дата: ${new Date(trans_date).toLocaleDateString('ru').split('/').join('.')}</div>
          <div>Номер операции: ${ret_ref_number}</div>
          <div>Номер заказа: ${order_id}</div>
          <div>Назначение платежа: оплата за онлайн-обучение на сайте ${sitename}</div>
          <div>Название курса: ${course.name}</div>
          <div>Данные пользователя: ${user.lastname} ${user.firstname} ${user.middlename}</div>
          <br />
          <div>Сумма: ${value}.00 р. (${toWrittenAmount(value)})</div>

          <hr />

          <div>Код авторизации: ${auth_code}</div>
          <div>Номер карты: ${masked_number}</div>

          <hr />

          <div>Получатель:</div>
          <div>федеральное государственное образовательное учреждение высшего</div>
          <div>образования "Кемеровский государственный университет"</div>
          <div>УФК по Кемеровской области (КемГУ л/с 20396X41400)</div>
          <div>ИНН/КПП 4207017537/420501001</div>
          <div>р/с 40501810700002000001</div>
          <div>БИК 043 207 001</div>
          <div>ОТДЕЛЕНИЕ КЕМЕРОВО</div>

          <hr />

          <div>Принято к оплате ПАО Банк "ФК Открытие"</div>
          <div style="padding: 20px">
            <div style="border: 2px solid black; padding: 10px; width: 200px; margin: auto; text-align: center">
              <div style="font-size: 12px">ПАО Банк "ФК Открытие"</div>
              <div style="font-size: 8px">115114, г. Москва, ул. Летниковская, д. 2, стр. 4</div>
              <div style="font-size: 10px; margin-top: 20px">БИК: 044525985 ИНН: 7706092528</div>
              <div style="font-size: 8px">Кор.счет № 30101810300000000985</div>
              <div style="font-size: 10px">в ГУ Банка России по ЦФО</div>
              <div style="font-size: 16px; font-weight: bold; margin-top: 20px">ПЛАТЕЖ ВЫПОЛНЕН</div>
            </div>
          </div>
          <div>По вопросам предоставления услуги обращайтесь к получателю платежа</div>

        </body>
      </html>
    `;
    const emailSubject = `Оплата за онлайн-обучение на сайте ${sitename}`;
    const emailHTML = `
      <div>Оплата за курс прошла успешно.</div>
      <div>Вы были записаны на курс: ${course.name} (<a href="${url + '/course-delivery/' + course.id}">Перейти к курсу</a>).</div>
    `;
    pdf.create(pdfContent, { format: 'A4', width: '350px', height: '500px' }).toBuffer(function (error, buffer) {
      const receipt = { filename: 'Квитанция.pdf', content: buffer };
      sendEmail(user.email, emailSubject, emailHTML, [receipt]);
    });

  } finally {
    if (db !== undefined) db.end();
    res.sendStatus(200);
    next();
  }
  
});

if (process.env.NODE_ENV === 'production') app.get('/*', function(req, res) { 
  const _path = path.resolve('./public/index.html');
  res.sendFile(_path);
});

app.use(errorLogger);

app.listen(process.env.PORT);
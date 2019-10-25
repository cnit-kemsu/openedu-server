import path from 'path';
import { sitename } from '../config';
import { pool } from './dbPool';
import { sendEmail } from './sendEmail';
import { toWrittenCrun } from './toWrittenCrun';
import { createPdf } from './createPdf';

function createSertificateContent(course, user, { sertificateNumber }) {
  return `
    <html>
      <head>
      <style>
        body {
          margin: 0px;
          color: rgb(47, 47, 47);
          font-family: 'calibri';
          font-weight: 500;
        }
        #page1 {
          background-image: url('sertificate-page-1.jpg');
          background-size: 100% 100%;
          width: 100%;
          height: 100%;
        }
        #page2 {
          background-image: url('sertificate-page-2.jpg');
          background-size: 100% 100%;
          width: 100%;
          height: 100%;
        }
        #fullname {
          position: absolute;
          top: 20.5%;
          height: 4%;
          left: 40%;
          width: 55%;
          padding: 20px;
          text-align: center;
          font-size: 42px;
          font-weight: bold;
          text-transform: uppercase;
        }
        #name_and_credit_units {
          position: absolute;
          top: 27%;
          left: 40%;
          width: 55%;
        }
        #name {
          width: 100%;
          text-align: center;
          font-size: 42px;
          font-weight: bold;
          text-transform: uppercase;
        }
        #credit_units {
          margin-top: 10px;
          width: 100%;
          text-align: center;
          font-size: 36px;
        }
        #date {
          position: absolute;
          bottom: 52.2%;
          left: 9%;
          font-size: 28px;
        }
        #sertificate_number {
          position: absolute;
          bottom: 61.8%;
          left: 73.3%;
          font-size: 36px;
        }
      </style>
      <body>

        <div id="page1">
          <div id="fullname">${user.lastname} ${user.firstname} ${user.middlename}</div>
          <div id="name_and_credit_units">
            <div id="name">${course.name}</div>
            <div id="credit_units">(${course.creditUnits} ${toWrittenCrun(course.creditUnits)})</div>
          </div>
          <div id="date">${new Date().toLocaleString('ru').split(',')[0].replace(/\//g, '.')}</div>
          <div id="sertificate_number">${sertificateNumber}</div>
        </div>
        <div id="page2">Сертификат 2</div>

      </body>
    </html>
  `;
}

const base = path.resolve(__dirname) |> #.replace(/\\/g, '/') |> 'file:///' + #;

export async function sendSertificate(req, res, next) {

  const userId = req.params.userId;
  const courseId = req.params.courseId;
  const db = await pool.getConnection();

  try {
    // const info = req.body;
    // const status = info.status.type === 'success' ? 'success' : 'failed';
    // await db.query('UPDATE paid_course_purchases SET callback_status = ?, callback_info = ?, callback_date = ? WHERE order_id = ?', [status, info, new Date(), info.order_id]);
    // const { user, course } = JSON.parse(info.additional_info);

    
    const emailSubject = `Сертификат об онлайн-обучении на сайте ${sitename}`;
    const emailHTML = `
      <div>Вы успешно прошли обучение.</div>
    `;
    const receiptFile = {
      filename: 'Сертификат.pdf',
      //content: await createSertificateContent(course, user, info) |> createPdf(#, { format: 'A4', width: '350px', height: '500px', "base": "file://" })
      content: createSertificateContent({ creditUnits: 5, name: 'Управление качеством' }, { lastname: 'Бондарев', firstname: 'Иван', middlename: 'Владимирович' }, { sertificateNumber: '18473626' }) |> await createPdf(#, { format: 'A4', orientation: 'landscape', base })
    };
    //sendEmail(user.email, emailSubject, emailHTML, [receiptFile]);
    sendEmail('johncooper87@mail.ru', emailSubject, emailHTML, [receiptFile]);

  } finally {
    if (db !== undefined) db.end();
    res.sendStatus(200);
    next();
  }
  
}
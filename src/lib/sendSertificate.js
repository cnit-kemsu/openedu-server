import path from 'path';
import { sitename } from '../config';
import { pool } from './dbPool';
import { sendEmail } from './sendEmail';
import { toWrittenAmount } from './toWrittenAmount';
import { createPdf } from './createPdf';

function createSertificateContent(course, user, {}) {
  return `
    <html>
      <head>
      <style>
        body {
          padding: 0px;
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
      </style>
      <body>

        <div id="page1">Сертификат 1</div>
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
      content: createSertificateContent({}, {}, {}) |> await createPdf(#, { format: 'A4', orientation: 'landscape', base })
    };
    //sendEmail(user.email, emailSubject, emailHTML, [receiptFile]);
    sendEmail('johncooper87@mail.ru', emailSubject, emailHTML, [receiptFile]);

  } finally {
    if (db !== undefined) db.end();
    res.sendStatus(200);
    next();
  }
  
}
import { sitename, url, zoom } from '../../config';
import { pool } from './dbPool';
import { sendEmail } from './sendEmail';
import { toWrittenAmount } from './toWrittenAmount';
import { createPdf } from './createPdf';
import { findUser, findCourse } from '@lib/authorization';

function createReceiptContent(course, user, { trans_date, order_id, ref_set: { auth_code, ret_ref_number }, source_card: { masked_number }, amount: { value } }) {
  return `
    <html>
      <head>
      <style>
        body {
          ${zoom ? `zoom: ${zoom/1.5};` : ''}
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
}

export async function paymentCallback(req, res, next) {

  const db = await pool.getConnection();

  try {
    const info = req.body;
    const status = info.status.type === 'success' ? 'success' : 'failed';
    await db.query('UPDATE paid_course_purchases SET callback_status = ?, callback_info = ?, callback_date = ? WHERE order_id = ?', [status, info, new Date(), info.order_id]);
    const { user, course } = JSON.parse(info.additional_info);

    
    const emailSubject = `Оплата за онлайн-обучение на сайте ${sitename}`;
    const emailHTML = `
      <div>Оплата за курс прошла успешно.</div>
      <div>Вы были записаны на курс: ${course.name} (<a href="${url + '/course-delivery/' + course.id}">Перейти к курсу</a>).</div>
    `;
    const receiptFile = {
      filename: 'Квитанция.pdf',
      content: createReceiptContent(course, user, info) |> await createPdf(#, { format: 'A4', width: '350px', height: '500px' })
    };
    sendEmail(user.email, emailSubject, emailHTML, [receiptFile]);

    const _user = await findUser(user.id, db);
    const _course = await findCourse(course.id, db);
    _user.pushCourseKey(course.id);

  } finally {
    if (db !== undefined) db.end();
    res.sendStatus(200);
    next();
  }
  
}
import crypto from 'crypto';
import {
  sitename,
  url,
  devUrl,
  payment
} from '../../config';
const _url = devUrl || url;

function getRightFormatNowDate(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .substring(0, 19)
    + (offset < 0 ? '+' : '-') + ('0' + Math.floor(Math.abs(offset) / 60)).slice(-2) + ':' + ('0' + offset % 60).slice(-2);
}

const { token, secret } = payment;
const currency = 'RUB';

const merchantName = 'Кемеровский государственный университет';
const callbackPath = '/payment-callback';

export function createPaymentRequest(amountValue, additionalInfo) {
  if (!additionalInfo?.user?.id) throw Error('User id must be defined');
  if (!additionalInfo?.course?.id) throw Error('Course id must be defined');

  const orderId = new Date().valueOf().toString();
  const requestDate = getRightFormatNowDate(new Date());
  const _amountValue = Math.round(amountValue * 100 ) / 100 |> #.toString() + '.00';
  let signature = `token=${token}order_id=${orderId}request_date=${requestDate}amount.value=${_amountValue}amount.currency=${currency}`;
  signature = crypto.createHmac('sha256', secret).update(signature).digest('hex');

  const request = {
    token,
    order_id: orderId,
    request_date: requestDate,
    amount: {
      value: _amountValue,
      currency
    },
    additional_info: JSON.stringify(additionalInfo),
    description: `Плата за онлайн-обучение на сайте ${sitename}`,
    callback_url: _url + callbackPath,
    return_url: url + '/course-delivery/' + additionalInfo.course.id,
    merchant_name: merchantName,
    signature
  };

  return [
    JSON.stringify(request) |> Buffer.from(#).toString('base64'),
    request
  ];
}
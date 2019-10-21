const n1Arr = [null, 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
const n2Arr_1 = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const n2Arr_2 = [null, null, 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const n3Arr_1 = [null, 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const n3Arr_2 = [null, 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];

function notNull(value) {
  return value !== null;
}

function toWrittenDigits(num, units, feminine = false) {
  const writtenDigits = [];

  const n1 = Math.floor(num / 100);
  const n2 = Math.floor(num % 100 / 10);
  const n3 = num % 10;

  writtenDigits.push(n1Arr[n1]);
  if (n2 === 1) writtenDigits.push(n2Arr_1[n3]);
  else {
    writtenDigits.push(n2Arr_2[n2]);
    writtenDigits.push(feminine ? n3Arr_2[n3] : n3Arr_1[n3]);
  }

  //if (num === 0) writtenDigits.push('ноль');

  let unit = '';
  if (n2 === 1) unit = units[2];
  else if (n3 === 1) unit = units[0];
  else if (n3 > 0 && n3 < 5) unit = units[1];
  else unit = units[2];

  return writtenDigits.filter(notNull).join(' ') + ' ' + unit;
}

  const rubArr = ['рубль', 'рубля', 'рублей'];
  const thausArr = ['тысяча', 'тысячи', 'тысяч'];

export function toWrittenAmount(_amount) {
  const amount = Math.floor(_amount);
  const writtenAmount = [];

  const a1 = Math.floor(amount / 1000);
  const a2 = amount % 1000;

  if (a1 > 0) toWrittenDigits(a1, thausArr, true) |> writtenAmount.push;
  toWrittenDigits(a2, rubArr) |> writtenAmount.push;

  return writtenAmount.join(' ') + ' и ноль копеек';
}

//toWrittenAmount(1340) |> console.log;
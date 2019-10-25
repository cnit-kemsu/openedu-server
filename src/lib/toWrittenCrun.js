const crunArr = ['зачетная единица', 'зачетные единицы', 'зачетных единиц'];

function toWrittenUnits(num, units) {

  //const n1 = Math.floor(num / 100);
  const n2 = Math.floor(num % 100 / 10);
  const n3 = num % 10;

  let unit = '';
  if (n2 === 1) unit = units[2];
  else if (n3 === 1) unit = units[0];
  else if (n3 > 0 && n3 < 5) unit = units[1];
  else unit = units[2];

  return unit;
}

export function toWrittenCrun(amount) {
  return toWrittenUnits(amount, crunArr);
}
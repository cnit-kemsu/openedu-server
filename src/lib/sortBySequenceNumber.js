export function sortBySequenceNumber(obj1, obj2) {
  if (obj1.sequenceNumber === null) return 0;
 return obj1.sequenceNumber - obj2.sequenceNumber;
}
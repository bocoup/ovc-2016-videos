
// add leading zeros to a string
export function leadingZeroFormat(x, length) {
  return ('00000000' + x).slice(-length);
}

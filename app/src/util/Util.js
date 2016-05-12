
// add leading zeros to a string
export function leadingZeroFormat(x, length) {
  return ('00000000' + x).slice(-length);
}

// time is in seconds
export function timeFormat(time) {
  const seconds = time % 60;
  const minutes = Math.floor(time / 60);

  return `${leadingZeroFormat(minutes, 2)}:${leadingZeroFormat(seconds, 2)}`;
}

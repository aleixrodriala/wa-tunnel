/* eslint-disable */
Uint8Array.prototype.indexOfMulti = (searchElements, fromIndex) => {
  fromIndex = fromIndex || 0;

  var index = Array.prototype.indexOf.call(this, searchElements[0], fromIndex);
  if (searchElements.length === 1 || index === -1) {
    // Not found or no other elements to check
    return index;
  }

  for (var i = index, j = 0; j < searchElements.length && i < this.length; i++, j++) {
    if (this[i] !== searchElements[j]) {
      return this.indexOfMulti(searchElements, index + 1);
    }
  }

  return i === index + searchElements.length ? index : -1;
};

function splitBuffer(b, d, multi) {
  const ret = [];
  let s = 0;
  let i;
  if (multi) i = b.indexOfMulti(d, s);
  else i = b.indexOf(d, s);
  while (i >= 0) {
    if (i >= 0) {
      ret.push(b.slice(s, i));
    }
    s = i + d.length;
    if (multi) i = b.indexOfMulti(d, s);
    else i = b.indexOf(d, s);
  }
  ret.push(b.slice(s));
  return ret;
}

exports.splitBuffer = splitBuffer;

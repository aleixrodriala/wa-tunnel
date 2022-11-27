function chunkString(str, len) {
  const size = Math.ceil(str.length / len);
  const r = Array(size);
  let offset = 0;

  for (let i = 0; i < size; i++) {
    r[i] = str.substr(offset, len);
    offset += len;
  }
  return r;
}

function indexOfMulti(buffer, searchElements, fromIndex) {
  fromIndex = fromIndex || 0;

  var index = buffer.indexOf(searchElements[0], fromIndex);
  if (searchElements.length === 1 || index === -1) {
    // Not found or no other elements to check
    return index;
  }

  for (var i = index, j = 0; j < searchElements.length && i < buffer.length; i++, j++) {
    if (buffer[i] !== searchElements[j]) {
      return indexOfMulti(buffer, searchElements, index + 1);
    }
  }
  return i === index + searchElements.length ? index : -1;
};

function splitBuffer(b, d, multi) {
  const ret = [];
  let s = 0;
  let i;
  if (multi) i = indexOfMulti(b, d, s);
  else i = b.indexOf(d, s);
  while (i >= 0) {
    if (i >= 0) {
      ret.push(b.slice(s, i));
    }
    s = i + d.length;
    if (multi) i = indexOfMulti(b, d, s);
    else i = b.indexOf(d, s);
  }
  ret.push(b.slice(s));
  return ret;
}

exports.splitBuffer = splitBuffer;
exports.chunkString = chunkString;

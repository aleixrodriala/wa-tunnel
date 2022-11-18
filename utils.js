function chunkString (str, len) {
  const size = Math.ceil(str.length/len)
  const r = Array(size)
  let offset = 0
  
  for (let i = 0; i < size; i++) {
    r[i] = str.substr(offset, len)
    offset += len
  }
  
  return r
}

function splitBuffer(b, d) {
    const ret = [];
    let s = 0;
    let i = b.indexOf(d, s);
    while (i >= 0) {
        if (i >= 0) {
            ret.push(b.slice(s, i));
        }
        s = i + d.length;
        i = b.indexOf(d, s);
    }
    ret.push(b.slice(s));
    return ret;
}

exports.chunkString = chunkString;
exports.splitBuffer = splitBuffer

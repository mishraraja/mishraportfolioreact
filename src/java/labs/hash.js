/** Java's String.hashCode, bit for bit: s[0]*31^(n-1) + … + s[n-1], in 32-bit ints. */
export function javaHash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return h;
}

/** HashMap.hash(): folds the high bits into the low ones before masking. */
export function spread(h) {
  return (h ^ (h >>> 16)) | 0;
}

export function bucketIndex(h, capacity) {
  return spread(h) & (capacity - 1);
}

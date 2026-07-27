function sanitizeFirestore(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (Array.isArray(item)) {
        return { _isNestedArray: true, data: sanitizeFirestore(item) };
      }
      return sanitizeFirestore(item);
    });
  }
  const res = {};
  for (const k of Object.keys(obj)) {
    if (Array.isArray(obj[k])) {
        res[k] = obj[k].map(item => {
            if (Array.isArray(item)) {
                return { _isNestedArray: true, data: sanitizeFirestore(item) };
            }
            return sanitizeFirestore(item);
        });
    } else {
        res[k] = sanitizeFirestore(obj[k]);
    }
  }
  return res;
}
console.log(sanitizeFirestore({ a: [[1, 2]] }));

export default class DocumentIndex {
  constructor () {
    this._index = {}
  }

  get (key, fullOp = false) {
    return fullOp
      ? this._index[key]
      : this._index[key] ? this._index[key].payload.value : null
  }

  updateIndex (oplog, onProgressCallback) {
    const values = oplog.values
    const handled = {}
    for (let i = values.length - 1; i >= 0; i--) {
      const item = values[i]
      if (item.payload.op === 'PUTALL' && item.payload.docs && item.payload.docs[Symbol.iterator]) {
        for (const doc of item.payload.docs) {
          if (doc && !handled[doc.key]) {
            handled[doc.key] = true
            this._index[doc.key] = {
              payload: {
                op: 'PUT',
                key: doc.key,
                value: doc.value
              }
            }
          }
        }
      } else if (!handled[item.payload.key]) {
        handled[item.payload.key] = true
        if (item.payload.op === 'PUT') {
          this._index[item.payload.key] = item
        } else if (item.payload.op === 'DEL') {
          delete this._index[item.payload.key]
        }
      }
      if (onProgressCallback) {
        onProgressCallback(item, values.length - i)
      }
   }
}

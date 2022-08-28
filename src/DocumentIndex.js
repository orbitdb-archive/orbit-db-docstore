'use strict'

class DocumentIndex {
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
      for (let i  = 0; i <= values.length -1; i++) {
      const item = values[i]
      if (item.payload.op === 'PUTALL' && item.payload.docs && item.payload.docs[Symbol.iterator]) {
        for (const doc of item.payload.docs) {
          if (doc) {
            this._index[doc.key] = {
              payload: {
                op: 'PUT',
                key: doc.key,
                value: doc.value
              }
            }
          }
        }
      } if (item.payload.op === 'PUT') {
          this._index[item.payload.key] = item
        } else if (item.payload.op === 'DEL') {
          delete this._index[item.payload.key]
        } else if (item.payload.op === 'SET') {
          if (this._index[item.payload.key]) {
            Object.assign(this._index[item.payload.key].payload.value,item.payload.value)
          }
        }
      if (onProgressCallback) {
        onProgressCallback(item, values.length - i)
      }
    }
  }
}

module.exports = DocumentIndex

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
    const reducer = (handled, item, idx) => {
      if (item.payload.op === 'PUTALL' && item.payload.docs[Symbol.iterator]) {
        for (const doc of item.payload.docs) {
          if (doc && handled[doc.key] !== true) {
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
      } else if (handled[item.payload.key] !== true) {
        handled[item.payload.key] = true
        if (item.payload.op === 'PUT') {
          this._index[item.payload.key] = item
        } else if (item.payload.op === 'DEL') {
          delete this._index[item.payload.key]
        }
      }
      if (onProgressCallback) onProgressCallback(item, idx)
      return handled
    }

    oplog.values
      .slice()
      .reverse()
      .reduce(reducer, {})
  }
}

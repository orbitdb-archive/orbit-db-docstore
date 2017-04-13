'use strict'

class DocumentIndex {
  constructor() {
    this._index = {}
  }

  get(key) {
    return this._index[key]
  }

  updateIndex(oplog, onProgressCallback) {
    const reducer = (handled, item, idx) => {
      // if (handled.indexOf(item.payload.key) === -1) {
      if (handled[item.payload.key] !== true) {
        // handled.push(item.payload.key)
        handled[item.payload.key] = true
        if(item.payload.op === 'PUT') {
          this._index[item.payload.key] = item.payload.value
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

module.exports = DocumentIndex

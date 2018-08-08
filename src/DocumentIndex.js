'use strict'

class DocumentIndex {
  constructor () {
    this._index = {}
  }

  updateIndex (oplog, onProgressCallback) {
    const reducer = (handled, item, idx) => {
      if (handled[item.payload.key] !== true) {
        handled[item.payload.key] = true
        if(item.payload.op === 'PUT') {
          this._index[item.hash] = item
        } else if (item.payload.op === 'DEL') {
          delete this._index[item.hash]
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

'use strict'

class DocumentIndex {
  constructor () {
    this._index = {}
  }

  get (key, fullOp = false) {
    return fullOp
      ? this._index[key]
      : this._index[key].payload.value
  }

  _updateIndex (oplog, entry) {
    if (this._index[entry.payload.key] === undefined || this._index[entry.payload.key].clock.time < entry.clock.time) {
      if (entry.payload.op === 'PUT')
        this._index[entry.payload.key] = entry
      else if (entry.payload.op === 'DEL' && this._index[entry.payload.key] !== undefined)
        delete this._index[entry.payload.key]
    }

  updateIndex (oplog, onProgressCallback) {
    if (typeof onProgressCallback == 'object')
      return this._updateIndex(oplog, onProgressCallback)
    const reducer = (handled, item, idx) => {
      if (handled[item.payload.key] !== true) {
        handled[item.payload.key] = true
        if(item.payload.op === 'PUT') {
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

module.exports = DocumentIndex

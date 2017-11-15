'use strict'

class DocumentIndex {
  constructor () {
    this._index = {}
  }

  all () {
    return Object.values(this._index)
  }

  keys () {
    return Object.keys(this._index)
  }

  get (key) {
    return this._index[key]
  }

  updateIndex (oplog, onProgressCallback) {
    const reducer = (handled, item, idx) => {
      const key = item.payload.key
      if (handled[key] !== true) {
        handled[key] = true
        if(item.payload.op === 'PUT') {
          if (!item._revs)
            item._revs = new Set()
          item._revs.add(item)
          this._index[key] = item//.payload.value
        } else if (item.payload.op === 'DEL') {
          delete this._index[key]
        }
      } else {
        if(this._index[key] && item.payload.op === 'PUT') {
          if (!this._index[key]._revs)
            this._index[key]._revs = new Set()
          this._index[key]._revs.add(item)
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

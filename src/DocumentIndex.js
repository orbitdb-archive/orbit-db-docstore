'use strict'
const elasticlunr = require('elasticlunr')

class DocumentIndex {
  constructor () {
    this._index = {}
    this._lunr = elasticlunr()
  }

  get (key, fullOp = false) {
     return fullOp
       ? this._index[key]
       : this._index[key] ? this._index[key].payload.value : null
   }

  updateIndex (oplog, onProgressCallback) {
    const reducer = (handled, item, idx) => {
      if (handled[item.hash] !== true) {
        handled[item.hash] = true
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

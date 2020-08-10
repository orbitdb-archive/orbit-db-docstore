'use strict'

class DocumentIndex {
  constructor () {
    this._index = {}
    this._lastHash = null
  }

  get (key, fullOp = false) {
    return fullOp
      ? this._index[key]
      : this._index[key] ? this._index[key].payload.value : null
  }

  updateIndex (oplog, onProgressCallback) {
    const reducer = (handled, item, idx) => {
      const key = item.payload.key
      if (item.payload.op === 'PUTALL') {
        for (const doc of item.payload.docs) {
          if (handled[doc.key] !== true) {
            handled[doc.key] = true
            this._index[doc.key] = {
              op: item.payload.op,
              key: doc.key,
              value: doc.value
            }
          }
        }
      } else if (handled[item.payload.key] !== true) {
        handled[key] = true
        if (item.payload.op === "PUT") {
          if (!this._index[key]) {
            this._index[key] = item
            // this.events.emit("added", key, item.payload.value, item)
          } else {
            if (item.clock.time > this._index[key].clock.time) {
              this._index[key] = item
              // this.events.emit("updated", key, item.payload.value, item)
            }
          }
        } else if (item.payload.op === "DEL") {
          delete this._index[key]
          // this.events.emit("deleted", item)
        }
      }
      if (onProgressCallback) onProgressCallback(item, idx)
      return handled
    }

    // TODO: let values = oplog.iterator({ gt: this._lastHash }).collect()
    let values = oplog.values.reverse()

    // Process only the ops after last index update
    if (this._lastHash) {
      // TODO: handle the case where updates in the log may be before the last hash (ie. older)
      const i = values.findIndex(e => e.hash === this._lastHash)
      if (i > -1) {
        values = values.slice(0, i)
      }
    }

    values.reduce(reducer, {})
    // Store the latest processed op
    this._lastHash = values[0] ? values[0].hash : null
  }
}

module.exports = DocumentIndex

'use strict'

const Store = require('orbit-db-store')
const DocumentIndex = require('./DocumentIndex')
const pMap = require('p-map')
const Readable = require('readable-stream')

const replaceAll = (str, search, replacement) => str.toString().split(search).join(replacement)

class DocumentStore extends Store {
  constructor (ipfs, id, dbname, options) {
    if (!options) options = {}
    if (!options.indexBy) Object.assign(options, { indexBy: '_id' })
    if (!options.Index) Object.assign(options, { Index: DocumentIndex })
    super(ipfs, id, dbname, options)
    this._type = 'docstore'
  }

  get (key, caseSensitive = false) {
    key = key.toString()
    const terms = key.split(' ')
    key = terms.length > 1 ? replaceAll(key, '.', ' ').toLowerCase() : key.toLowerCase()

    const search = (e) => {
      if (terms.length > 1) {
        return replaceAll(e, '.', ' ').toLowerCase().indexOf(key) !== -1
      }
      return e.toLowerCase().indexOf(key) !== -1
    }
    const mapper = e => this._index.get(e)
    const filter = e => caseSensitive
      ? e.indexOf(key) !== -1
      : search(e)

    return Object.keys(this._index._index)
      .filter(filter)
      .map(mapper)
  }

  query (mapper, options = {}) {
    // Whether we return the full operation data or just the db value
    const fullOp = options.fullOp || false

    return Object.keys(this._index._index)
      .map((e) => this._index.get(e, fullOp))
      .filter(mapper)
  }

  batchPut (docs, onProgressCallback) {
    const mapper = (doc, idx) => {
      return this._addOperationBatch(
        {
          op: 'PUT',
          key: doc[this.options.indexBy],
          value: doc
        },
        true,
        idx === docs.length - 1,
        onProgressCallback
      )
    }

    return pMap(docs, mapper, { concurrency: 1 })
      .then(() => this.saveSnapshot())
  }

  put (doc, options = {}) {
    if (!doc[this.options.indexBy])
      throw new Error(`The provided document doesn't contain field '${this.options.indexBy}'`)

    return this._addOperation({
      op: 'PUT',
      key: doc[this.options.indexBy],
      value: doc
    }, options)
  }

  del (key, options = {}) {
    if (!this._index.get(key))
      throw new Error(`No entry with key '${key}' in the database`)

    return this._addOperation({
      op: 'DEL',
      key: key,
      value: null
    }, options)
  }
}

module.exports = DocumentStore

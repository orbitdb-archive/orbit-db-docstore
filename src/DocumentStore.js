'use strict'

const Store = require('orbit-db-store')
const DocumentIndex = require('./DocumentIndex')
const pMap = require('p-map')
const Readable = require('readable-stream')

const replaceAll = (str, search, replacement) => str.toString().split(search).join(replacement)

class DocumentStore extends Store {
  constructor(ipfs, id, dbname, options) {
    if (!options) options = {}
    if (!options.indexBy) Object.assign(options, { indexBy: '_id' })
    if (!options.Index) Object.assign(options, { Index: DocumentIndex })
    super(ipfs, id, dbname, options)
    this._type = 'docstore'
  }

  get(key, options = {}) {
    // Default options
    options = Object.assign({}, { caseSensitive: false, fullOp: false }, options)

    // Make sure the key is a string
    key = key.toString()

    // If the key contain spaces, consider it as multiple terms
    const parts = key.split(' ')

    // Not sure what this is?
    key = parts.length > 1 
      ? replaceAll(key, '.', ' ').toLowerCase() 
      : key.toLowerCase()

    // Find a text from a given string (true|false)
    const search = (str, text, parts) => {
      if (parts.length > 1) {
        return replaceAll(str, '.', ' ').toLowerCase().indexOf(text) !== -1
      }
      return str.toLowerCase().indexOf(text) !== -1
    }

    // Search for the given key from the values
    const filter = e => options.caseSensitive
      ? e.indexOf(key) !== -1 
      : search(e, key, parts)

    // Get a document from the index with a key
    const getFromIndex = e => this._index.get(e)

    // If full operation wasn't requested, 
    // return only the actual document
    const transformOperation = e => options.fullOp ? e : e.payload.value

    return this._index.keys()
      .filter(filter)
      .map(getFromIndex)
      .map(transformOperation)
  }

  query(mapper, options = {}) {
    // Default options
    options = Object.assign({}, { fullOp: false }, options)

    // If full operation wasn't requested, 
    // return only the actual document
    const transformOperation = e => options.fullOp ? e : e.payload.value

    return this._index.all()
      .map(transformOperation)
      .filter(mapper)
  }

  batchPut(docs, onProgressCallback) {
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

  put(doc) {
    if (!doc[this.options.indexBy])
      throw new Error(`The provided document doesn't contain field '${this.options.indexBy}'`)

    return this._addOperation({
      op: 'PUT',
      key: doc[this.options.indexBy],
      value: doc
    })
  }

  del(key) {
    if (!this._index.get(key))
      throw new Error(`No entry with key '${key}' in the database`)

    return this._addOperation({
      op: 'DEL',
      key: key,
      value: null
    })
  }
}

module.exports = DocumentStore

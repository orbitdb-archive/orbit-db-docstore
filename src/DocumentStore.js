'use strict'

const Store = require('orbit-db-store')
const DocumentIndex = require('./DocumentIndex')
const pMap = require('p-map')
const Readable = require('readable-stream')
const elasticlunr = require('elasticlunr')

const replaceAll = (str, search, replacement) => str.toString().split(search).join(replacement)

class DocumentStore extends Store {
  constructor (ipfs, id, dbname, options) {
    if (!options) options = {}
    if (!options.indexBy) Object.assign(options, { indexBy: ['hash'] })
    if (!options.Index) Object.assign(options, { Index: DocumentIndex })
    super(ipfs, id, dbname, options)
    this._createSearchIndex(options.indexBy)
    this._type = 'docstore'
  }

  _createSearchIndex(indexKeys = ['_id']) {
    this.searchIndex = elasticlunr()
    indexKeys.forEach((indexBy) => {
      this.searchIndex.addField(indexBy)
    })
    this.searchIndex.setRef('hash')
  }

  get (key, caseSensitive = false) {
    key = key.toString()
    // const terms = key.split(' ')
    // key = terms.length > 1 ? replaceAll(key, '.', ' ').toLowerCase() : key.toLowerCase()
    //
    // const search = (e) => {
    //   if (terms.length > 1) {
    //     return replaceAll(e, '.', ' ').toLowerCase().indexOf(key) !== -1
    //   }
    //   return e.toLowerCase().indexOf(key) !== -1
    // }
    const docs = this.searchIndex.search(key).map(e => e.ref)
    const mapper = e => this._index.get(e)
    const filter = e => docs.includes(e.hash)

    return docs.map(e => this._index._index[e])
    // return Object.keys(this._index._index)
    //   .filter(filter)
    //   .map(mapper)
  }

  query (mapper, options = {}) {
    // Whether we return the full operation data or just the db value
    const fullOp = options ? options.fullOp : false

    return Object.keys(this._index._index)
      .map((e) => this._index.get(e, fullOp))
      .filter(mapper)
  }

  batchPut (docs, onProgressCallback) {
    const mapper = (doc, idx) => {
      return this._addOperationBatch(
        {
          op: 'PUT',
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

  async put (doc) {
    const indexCount = this.options.indexBy.filter(i => doc[i]).length
    if (indexCount < 1)
      throw new Error(`The provided document doesn't contain any field from'${this.options.indexBy}'`)

    doc.hash = await this._addOperation({
      op: 'PUT',
      key: null,
      value: doc
    })

    this.searchIndex.addDoc(doc)
    return doc.hash
  }

  del (key) {
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

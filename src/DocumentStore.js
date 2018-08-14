'use strict'

const Store = require('orbit-db-store')
const DocumentIndex = require('./DocumentIndex')
const pMap = require('p-map')
const elasticlunr = require('elasticlunr')

class DocumentStore extends Store {
  constructor (ipfs, id, dbname, options) {
    if (!options) options = {}
    if (!options.indexBy) Object.assign(options, { indexBy: ['hash'] })
    if (!options.Index) Object.assign(options, { Index: DocumentIndex })
    super(ipfs, id, dbname, options)
    this._addToLunr(options.indexBy)
    this._type = 'docstore'
  }

  _addToLunr(indexKeys) {
    indexKeys.forEach((indexBy) => {
      this._index._lunr.addField(indexBy)
    })
    this._index._lunr.setRef('hash')
    this.events.addListener('replicate', (address, entry) => {
      const idxDoc = Object.assign({}, entry.payload.value, { hash: entry.hash })
      this._index._lunr.addDoc(idxDoc)
    })
    this.events.addListener('load.progress', (addr, hash, entry, prog, max) => {
      const idxDoc = Object.assign({}, entry.payload.value, { hash: entry.hash })
      this._index._lunr.addDoc(idxDoc)
    })
  }

  get (key, options = { fullOp : false }) {
    key = key.toString()
    return this._index._lunr.search(key, options)
      .map(e => e.ref)
      .map(e => this._index._index[e])
      .filter(e => e !== undefined && e !== null)
      .map(e => options.fullOp ? e : e.payload.value)
  }

  query (mapper, options = {}) {
    // Whether we return the full operation data or just the db value
    const fullOp = options ? options.fullOp : false
    return Object.keys(this._index._index)
      .map((e) => this.get(e, { fullOp }))
      .filter(mapper)
  }

  batchPut (docs, onProgressCallback) {
    const mapper = async (doc, idx) => {
      const hash = await this._addOperationBatch({
          op: 'PUT',
          value: doc
        },
        true,
        idx === docs.length - 1,
        onProgressCallback
      )
      const idxDoc = Object.assign({}, doc, { hash: hash })
      this._index._lunr.addDoc(idxDoc)
      return hash
    }

    return pMap(docs, mapper, { concurrency: 1 })
      .then(() => this.saveSnapshot())
  }

  async put (doc) {
    const indexCount = this.options.indexBy.filter(i => doc[i]).length
    if (indexCount < 1)
      throw new Error(`The provided document doesn't contain any field from'${this.options.indexBy}'`)

    const hash = await this._addOperation({
      op: 'PUT',
      value: doc
    })

    const idxDoc = Object.assign({}, doc, { hash: hash })
    this._index._lunr.addDoc(idxDoc)
    return hash
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

'use strict'

const Store = require('orbit-db-store')
const DocumentIndex = require('./DocumentIndex')
const pMap = require('p-map')
const Readable = require('readable-stream')

const replaceAll = (str, search, replacement) => str.toString().split(search).join(replacement)

// indexes should be in the format: {indexBy: [{field: type}]}
// type can take either "text" or "numeric"
// "Text" index is straight-forward
// "Numeric" index requires storing the max and min value

class DocumentStore extends Store {
  constructor (ipfs, id, dbname, options) {
    if (!options) options = {};

    Object.assign(options, { indexBy: '_id'})

    if (!options.indexBy) {      
      this._indexedFields = {_id: {type: 'text'}}   // If there's no index indicated, use _id by default.
    } else {
      Object.keys(options.indexBy).forEach(function(index) {
        this._indexedFields[index].type = options.indexBy[index]        
      })
    }     
      
    if (!options.Index) 
      Object.assign(options, { Index: DocumentIndex })
    
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

  query (queryObj, options = {}) {
    // Whether we return the full operation data or just the db value
    //const fullOp = options ? options.fullOp : false
    var shortlisted_result = {}
    var unindexed_fields = []
    Object.keys(queryObj).forEach(function(field) {
      if (this._indexedFields[field]) {
        var value_to_retrieve = queryObj[field]
        shortlisted_result[field] = this._indexes[field][value_to_retrieve]
      } else {
        unindexed_fields.push(field)
      }
    });

    var value_to_search = []
    // Find matching records in shortlisted_results
    Object.keys(shortlisted_result).forEach(function(hash_array) {
      var 
    })

    return 
  }

  batchPut (docs, onProgressCallback) {
    const mapper = (doc, idx) => {
      return this._addOperationBatch(
        {
          op: 'PUT',
          key: doc['_id'],
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

  put (doc) {
    // If there is no _id in the object, create one using the current timestamp
    // precise to the mili-secondth to make sure no two _id's are the same
    if (!doc['_id'])
      doc['_id'] = Date.getTime().toString()

    // Check if all indexed fields exists in the input object except for _id
    Object.keys(this._indexedFields).forEach(function(index) {
      if (index != '_id' && !doc[index])
        throw new Error(`Field '${index}' doesn't exist in the object.`)
    });

    // Get the returned hash value and modify the indexes
    var hash_value = this._addOperation({
      op: 'PUT',
      key: doc['_id'],
      value: doc
    })
    
    // Modifying the indexes with new document
    Object.keys(this._indexedFields).forEach(function(index) {      
      doc_value_to_index = doc[index]
      if (!this._indexes[index][doc_value_to_index])
        this._indexes[index][doc_value_to_index] = []
      this._indexes[index][doc_value_to_index].push(hash_value)
      
      // If the index type is numeric, update the max and min value
      // FUTURE DEV: index float values in ranges
      if (this._indexedFields[index][type] == 'numeric') {
        if (!this._indexedFields[index]min || !this._indexedFields[index].max) {
          this._indexedFields[index].min = doc_value_to_index
          this._indexedFields[index].max = doc_value_to_index
        } else {
          if (doc_value_to_index < this._indexedFields[index].min)
            this._indexedFields[index].min = doc_value_to_index
          else if (doc_value_to_index > this._indexedFields[index].max)
            this._indexedFields[index].max = doc_value_to_index
        }
        
      }
    })


    return hash_value
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
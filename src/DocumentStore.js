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
    var indexBy = {}

    if (!options.indexBy) {
      Object.assign(options, { indexBy: '_id'})
    } else {
      indexBy = options.indexBy
      options.indexBy = '_id'
    }    
      
    if (!options.Index) 
      Object.assign(options, { Index: DocumentIndex })
    
    super(ipfs, id, dbname, options)

    // Expected input for indexBy is {indexBy: {field1: type1, field2: type2}}
    this._indexedFields = {}
    Object.keys(indexBy).forEach(function(index) {
        this._indexedFields[index].type = options.indexBy[index]
      })
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
    // const fullOp = options ? options.fullOp : false
    var shortlisted_result = {}
    var unindexed_fields = []
    Object.keys(queryObj).forEach(function(field) {
      if (this._indexedFields[field]) {
        var value_to_retrieve = queryObj[field]
        if (!this._indexes[field][value_to_retrieve]){
          // if there's no matching value, return right away
          return []
        } else {
          shortlisted_result[field] = this._indexes[field][value_to_retrieve]
        }
        
      } else {
        unindexed_fields.push(field)
      }
    });

    var reduced_queryObj = {}
    unindexed_fields.forEach(function(unindexed_field) {
      reduced_queryObj[unindexed_field] = queryObj[unindexed_field]
    })

    // Consolidate shortlisted results to one final array
    var id_array_to_search = []
    Object.keys(shortlisted_result).forEach(function(field) {
      var current_field_array = shortlisted_result[field]
      current_field_array.forEach(function(hash_value) {
        if (!array_to_search.includes(hash_value)) {
          array_to_search.push(hash_value)
        }
      })
    })

    var array_to_search = []
    id_array_to_search.map(e => array_to_search.push(this._index.get(e)))
    console.log(array_to_search)

    var value_to_search = []
    var results = []
    // Find matching records in shortlisted_results
    array_to_search.forEach(function(record) {
      var matched = true
      for (var field in reduced_queryObj) {
        if (record[field] != reduced_queryObj[field]) {
          matched = false
          break
        }
      }
      if (matched == false)
        continue
      else
        results.push(record)
      matched = true
    })

    return results
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
    
    // Modifying the indexes with new document
    Object.keys(this._indexedFields).forEach(function(index) {      
      doc_value_to_index = doc[index]
      if (!this._indexes[index][doc_value_to_index])
        this._indexes[index][doc_value_to_index] = []
      this._indexes[index][doc_value_to_index].push(doc._id)
      
      // If the index type is numeric, update the max and min value
      // FUTURE DEV: index float values in ranges
      if (this._indexedFields[index][type] == 'numeric') {
        if (!this._indexedFields[index].min || !this._indexedFields[index].max) {
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

    return this._addOperation({
      op: 'PUT',
      key: doc._id,
      value: doc
    })
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
'use strict'

const Store = require('orbit-db-store')
const DocumentIndex = require('./DocumentIndex')
const pMap = require('p-map')
const Readable = require('readable-stream')
const _ = require('underscore')

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
    this._indexes = {}
    var self = this
    Object.keys(indexBy).forEach(function(index) {
      self._indexes[index] = {}
      self._indexedFields[index] = {}
      self._indexedFields[index]['type'] = options.indexBy[index]
    })
    this._type = 'docstore'

  }

  get (_id, caseSensitive = false) {    
    const mapper = e => this._index.get(e)
    const filter = e => caseSensitive
      ? e.indexOf(_id) !== -1 
      : search(e)

    return Object.keys(this._index._index)
      .filter(filter)
      .map(mapper)
  }

  query (queryObj, options = {}) {
    var self = this
    // Whether we return the full operation data or just the db value
    // const fullOp = options ? options.fullOp : false
    var shortlisted_result = {}
    var unindexed_fields = []
    var reduced_queryObj = {}

    Object.keys(queryObj).forEach(function(field) {
      if (self._indexedFields[field]) {
        var value_to_retrieve = queryObj[field]
        if (!self._indexes[field][value_to_retrieve]){
          // if there's no matching value, return right away
          return []
        } else {
          shortlisted_result[field] = self._indexes[field][value_to_retrieve]
        }
        
      } else {
        reduced_queryObj[field] = queryObj[field]
      }
    });
    console.log(reduced_queryObj)
    
    
    var id_array_to_search = []
    if (JSON.stringify(queryObj) === JSON.stringify(reduced_queryObj)) {
      // If the query contains no indexed field, scan the whole store
      console.log("No indexed fields found in the query object, gotta scan the whole store")
      id_array_to_search = Object.keys(self._index._index)
    } else {
      // If the query contains at least one indexed field,
      // consolidate shortlisted results to one final array 
      Object.keys(shortlisted_result).forEach(function(field) {
        var current_field_array = shortlisted_result[field]
        if (id_array_to_search.length == 0) {
          id_array_to_search = current_field_array
        } else {
          id_array_to_search = _.intersection(id_array_to_search, current_field_array)
        }
        
      })
    }    

    var record_array_to_search = []
    id_array_to_search.map(e => record_array_to_search.push(this._index.get(e)))

    var value_to_search = []
    var results = []
    // Find matching records in shortlisted_results
    record_array_to_search.forEach(function(record) {
      var matched = true
      for (var field in reduced_queryObj) {
        if (record[field] != reduced_queryObj[field]) {
          matched = false
          break
        }
      }
      if (matched == false)
        return
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
    var self = this
    // If there is no _id in the object, create one using the current timestamp
    // precise to the mili-secondth to make sure no two _id's are the same
    if (!doc['_id'])
      doc['_id'] = Date.getTime().toString()

    // Check if all indexed fields exists in the input object except for _id
    Object.keys(self._indexedFields).forEach(function(index) {
      if (index != '_id' && !doc[index])
        throw new Error(`Field '${index}' doesn't exist in the object.`)
    });
    
    // Modifying the indexes with new document
    Object.keys(self._indexedFields).forEach(function(index) {      
      var doc_value_to_index = doc[index]
      if (!self._indexes[index][doc_value_to_index])
        self._indexes[index][doc_value_to_index] = []
      self._indexes[index][doc_value_to_index].push(doc._id)
      
      // If the index type is numeric, update the max and min value
      // FUTURE DEV: index float values in ranges
      if (self._indexedFields[index].type == 'numeric') {
        if (!self._indexedFields[index].min || !self._indexedFields[index].max) {
          self._indexedFields[index].min = doc_value_to_index
          self._indexedFields[index].max = doc_value_to_index
        } else {
          if (doc_value_to_index < self._indexedFields[index].min)
            self._indexedFields[index].min = doc_value_to_index
          else if (doc_value_to_index > self._indexedFields[index].max)
            self._indexedFields[index].max = doc_value_to_index
        }        
      }
    })

    return self._addOperation({
      op: 'PUT',
      key: doc._id,
      value: doc
    })
  }

  del (_id) {
    if (!this._index.get(_id))
      throw new Error(`No entry with _id '${_id}' in the database`)

    return this._addOperation({
      op: 'DEL',
      key: _id,
      value: null
    })
  }

  getIndex() {
    return this._indexedFields
  }
}

module.exports = DocumentStore
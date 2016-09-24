'use strict';

const KeyValueStore = require('orbit-db-kvstore');
const DocumentIndex = require('./DocumentIndex');

class DocumentStore extends KeyValueStore {
  constructor(ipfs, id, dbname, options) {
    if (!options) options = {};
    if (!options.Index) Object.assign(options, { Index: DocumentIndex });
    super(ipfs, id, dbname, options);
  }

  put(doc) {
    return this._addOperation({
      op: 'PUT',
      key: doc.title,
      value: doc,
      meta: {
        ts: new Date().getTime()
      }
    })
  }
}

module.exports = DocumentStore;

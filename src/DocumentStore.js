'use strict';

const Store = require('orbit-db-store');
const DocumentIndex = require('./DocumentIndex');

class DocumentStore extends Store {
  constructor(ipfs, id, dbname, options) {
    if (!options) options = {};
    if (!options.indexBy) Object.assign(options, { indexBy: '_id' });
    if (!options.Index) Object.assign(options, { Index: DocumentIndex });
    super(ipfs, id, dbname, options);
  }

  get(key) {
    return Object.keys(this._index._index)
    .filter((e) => e.indexOf(key) !== -1)
    .map((e) => this._index.get(e));
  }

  query(mapper) {
    return Object.keys(this._index._index)
      .map((e) => this._index.get(e))
      .filter((e) => mapper(e))
    }

  put(doc) {
    return this._addOperation({
      op: 'PUT',
      key: doc[this.options.indexBy],
      value: doc
    });
  }

  del(key) {
    return this._addOperation({
      op: 'DEL',
      key: key,
      value: null
    });
  }
}

module.exports = DocumentStore;

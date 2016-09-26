'use strict';

const Store = require('orbit-db-store');
const DocumentIndex = require('./DocumentIndex');

class DocumentStore extends Store {
  constructor(ipfs, id, dbname, options) {
    if (!options) options = {};
    if (!options.Index) Object.assign(options, { Index: DocumentIndex });
    super(ipfs, id, dbname, options);
  }

  get(title) {
    return Object.keys(this._index._index)
    .filter((e) => e.indexOf(title) !== -1)
    .map((e) => this._index.get(e));
  }

  put(doc) {
    return this._addOperation({
      op: 'PUT',
      key: doc.title,
      value: doc,
      meta: {
        ts: new Date().getTime()
      }
    });
  }

  del(key) {
    return this._addOperation({
      op: 'DEL',
      key: key,
      value: null,
      meta: {
        ts: new Date().getTime()
      }
    });
  }
}

module.exports = DocumentStore;

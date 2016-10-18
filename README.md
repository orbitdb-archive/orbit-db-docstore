# orbit-db-docstore

> Document Store for orbit-db

Database for storing indexed documents. Stores documents by `_id` field by default but you can also specify a custom field to index by.

*This is a core data store in [orbit-db](https://github.com/haadcode/orbit-db)*

## Install

```
npm install orbit-db-docstore
```

## Usage

```javascript
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

const ipfs = new IPFS()
const orbitdb = new OrbitDB(ipfs)
const docstore = orbitdb.docstore('db name')

docstore.put({ _id: 'hello world', doc: 'all the things' })
  .then(() => docstore.put({ _id: 'sup world', doc: 'other things' }))
  .then(() => docstore.get('hello'))
  .then((value) => console.log(value)) 
  // [{ _id: 'hello world', doc: 'all the things'}]

```

You can specify the field to index by in the options:

```javascript
const docstore = orbitdb.docstore('db name', { indexBy: 'doc' })

docstore.put({ _id: 'hello world', doc: 'some things' })
  .then(() => docstore.put({ _id: 'hello universe', doc: 'all the things' }))
  .then(() => docstore.get('all'))
  .then((value) => console.log(value)) 
  // [{ _id: 'hello universe', doc: 'all the things'}]

```

You can also use a mapper to query the documents

```javascript
const docstore = orbitdb.docstore('db name')

docstore.put({ _id: 'hello world', doc: 'some things', views: 10 })
  .then(() => docstore.put({ _id: 'hello universe', doc: 'all the things', views: 100 }))
  .then(() => docstore.put({ _id: 'sup world', doc: 'other things', views: 5 }))
  .then(() => docstore.query((e)=> e.views > 5))
  .then((value) => console.log(value)) 
  // [{ _id: 'hello world', doc: 'some things', views: 10}, { _id: 'hello universe', doc: 'all the things', views: 100}]
```

## API

*See [orbit-db API documentation](https://github.com/haadcode/orbit-db/blob/master/API.md) for full details*

### docstore(name, options)

  Package: 
  [orbit-db-docstore](https://github.com/shamb0t/orbit-db-docstore)

  ```javascript
  const db = orbitdb.docstore('orbit.users.shamb0t.profile')
  ```

  By default, documents are indexed by field '_id'. You can also specify the field to index by:

  ```javascript
  const db = orbitdb.docstore('orbit.users.shamb0t.profile', { indexBy: 'name' })
  ```

  - **put(doc)**
    ```javascript
    db.put({ _id: 'QmAwesomeIpfsHash', name: 'shamb0t', followers: 500 }).then((hash) => ...)
    ```
    
  - **get(key)**
    ```javascript
    const profile = db.get('shamb0t')
      .map((e) => e.payload.value)
    // [{ _id: 'shamb0t', name: 'shamb0t', followers: 500 }]
    ```
    
  - **query(mapper)**
    ```javascript
    const all = db.query((doc) => doc.followers >= 500)
    // [{ _id: 'shamb0t', name: 'shamb0t', followers: 500 }]
    ```

  - **del(key)**
    ```javascript
    db.del('shamb0t').then((removed) => ...)
    ```
    
  - **events**

    ```javascript
    db.events.on('data', (dbname, event) => ... )
    ```

    See [events](https://github.com/haadcode/orbit-db/blob/master/API.md#events) for full description.

## License

MIT ©️ 2016 shamb0t

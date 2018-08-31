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

const ipfs = new IPFS({
  EXPERIMENTAL: {
        pubsub: true,
    }
  })
const orbitdb = new OrbitDB(ipfs)
const docstore = orbitdb.docstore('db name')

docstore.put({ _id: 'hello world', doc: 'all the things' })
  .then(() => docstore.put({ _id: 'sup world', doc: 'other things' }))
  .then(() => docstore.get('hello'))
  .then((value) => console.log(value)) 
  // [{ _id: 'hello world', doc: 'all the things'}]

```

You can specify the fields to index by in the options:

```javascript
const docstore = orbitdb.docstore('db name', { indexBy: {first_name: 'string', age: 'numeric'}} })

docstore.put({ first_name: 'Tyra', age: '35', occupation: 'Fashion Model' })
  .then(() => docstore.put({ first_name: 'Lindsay', age: 20, occupation: 'Student'}))
  // [{ _id: 'hello universe', doc: 'all the things'}]

```

You can write a query to retrieve data

```javascript
const docstore = orbitdb.docstore('db name')

docstore.put({ first_name: 'Tyra', age: 35, occupation: 'Fashion Model' })
  .then(() => docstore.put({ first_name: 'Lindsay', age: 20, occupation: 'Student'}))
  .then(() => docstore.query({first_name: 'Tyra'})
  .then((value) => console.log(value)) 
  // [{ first_name: 'Tyra', age: 35, occupation: 'Fashion Model' }]
```

## API

*See [orbit-db API documentation](https://github.com/haadcode/orbit-db/blob/master/API.md) for full details*

### docstore(name, options)

  Package: 
  [orbit-db-docstore](https://github.com/shamb0t/orbit-db-docstore)

  ```javascript
  const db = orbitdb.docstore('user_profile')
  ```

  By default, documents are indexed by field '_id'. You can also specify the field to index by:

  ```javascript
  const db = orbitdb.docstore('orbit.users.shamb0t.profile', { indexBy: { name: 'string' } })
  ```

  - **put(doc)**
    ```javascript
    db.put({ _id: 123456789, name: 'shamb0t', followers: 500 }).then((hash) => ...)
    ```

    ```    
  - **query(queryObj)**
    ```javascript
    const all = db.query( { follower: 500 } )
    // [{ _id: 'shamb0t', name: 'shamb0t', followers: 500 }]
    ```

  - **del(_id)**
    ```javascript
    db.del(123456789).then((removed) => ...)
    ```
    
  - **events**

    ```javascript
    db.events.on('data', (dbname, event) => ... )
    ```

    See [events](https://github.com/haadcode/orbit-db/blob/master/API.md#events) for full description.

## License

[MIT](LICENSE) ©️ 2015-2018 shamb0t, Haja Networks Oy

Document Store for orbit-db

## Install

`npm install orbit-db-docstore`

## Usage:

```javascript
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

OrbitDB.connect('178.62.241.75:3333', 'tester', null, new IPFS(), { allowOffline: true })
  .then((orbitdb) => {
    const docstore = orbitdb.docstore('db name')
    docstore.put({ _id: 'hello world', doc: 'all the things'})
    .then(() => docstore.put({_id: 'sup world', doc: 'other things'}))
    .then(() => docstore.get('hello'))
    .then((value) => console.log(value)) // [{ _id: 'hello world', doc: 'all the things'}]
  })

```
You can specify an index in the options

```javascript

const docstore = orbitdb.docstore('db name', { indexBy:'doc' })
docstore.put({ _id: 'hello world', doc: 'some things'})
.then(() => docstore.put({ _id: 'hello universe', doc: 'all the things'}))
.then(() => docstore.get('all'))
.then((value) => console.log(value)) // [{ _id: 'hello universe', doc: 'all the things'}]

```

You can also use a mapper to query the documents

```javascript

const docstore = orbitdb.docstore('db name')
docstore.put({ _id: 'hello world', doc: 'some things', views: 10})
.then(() => docstore.put({ _id: 'hello universe', doc: 'all the things', views: 100}))
.then(() => docstore.put({ _id: 'sup world', doc: 'other things', views: 5}))
.then(() => docstore.query((e)=> e.views > 5))
.then((value) => console.log(value)) //[{ _id: 'hello world', doc: 'some things', views: 10}, { _id: 'hello universe', doc: 'all the things', views: 100}]

```

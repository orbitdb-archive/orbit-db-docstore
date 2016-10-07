Document Store for orbit-db

## Install

`npm install orbit-db-docstore`

## Usage:

```javascript
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

OrbitDB.connect('178.62.241.75:3333', 'tester', null, new IPFS(), { allowOffline: true })
  .then((orbitdb) => {
    const docstore = orbitdb.docstore('db name', { indexBy: 'title'})
    docstore.put({ title: 'hello world', doc: 'all the things'})
    .then(() => docstore.get('hello'))
    .then((value) => console.log(value)) // { title: 'hello world', doc: 'all the things'}
  })

```

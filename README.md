[![build status](https://api.travis-ci.org/disjunction/node-cache-manager-mongoose.png)](https://travis-ci.org/disjunction/node-cache-manager-mongoose) [![NPM version](https://badge.fury.io/js/cache-manager-mongoose.png)](http://badge.fury.io/js/cache-manager-mongoose) [![Coverage Status](https://coveralls.io/repos/github/disjunction/node-cache-manager-mongoose/badge.svg?branch=master)](https://coveralls.io/github/disjunction/node-cache-manager-mongoose?branch=master)

# cache-manager-mongoose

Mongoose store for node-cache-manager (See https://github.com/BryanDonovan/node-cache-manager)

Originally created as an alternative to node-cache-manager-mongodb store
to be able to use an existing mongoose connection.


## Usage examples

This store expects that the mongoose instance is provided explicitely.

It is not a concern of this module to establish a connection,
but it rather assumes that you already have one and use it in your project.


```javascript
const
    mongoose = require("mongoose"),
    cacheManager = require("cache-manager"),
    mongooseStore = require("cache-manager-mongoose");

mongoose.connect("mongodb://127.0.0.1/test");

const cache = cacheManager.caching({
    store: mongooseStore,
    mongoose: mongoose
});

// now you can use cache as any other cache-manager cache

```

### Options

All optionas are **optional**, except for `mongoose` instance.

The store creates a new Model on initialization, which you can partially customize. See example:

```javascript
const cache = cacheManager.caching({
    store: mongooseStore,
    mongoose: mongoose, // mongoose instance
    modelName: "MyModelName", // model name in mongoose registry

    // options for model creation
    modelOptions: {
        collection: "cacheman_rcp" // mongodb collection name
        versionKey: false // do not create __v field
    },

    ttl: 300 // time to live - 5 minutes (default is 1 minute),

    connection: connection, // provide only when using mongoose.createConnection()
});
```

If you want to keep your cache **forever**, set TTL to zero (`0`)

The default modelOptions are:
```json
{
    "collection": "MongooseCache",
    "versionKey": false,
    "read": "secondaryPreferred"
}
```

### Custom model

You can also provide your own model as long as it has the same
fields as the one used by default.

In this case you don't need to provide a `mongoose` instance,
as all it boils down to is a model object.

Here is an example:

```javascript
const schema = new mongoose.Schema(
    {
        // standard fields
        _id: String,
        val: mongoose.Schema.Types.Mixed,
        exp: Date,

        // all other fields you like
        foo: String,
        bar: Number
    },
    {
        collection: "my_collection",
        versionKey: false
    }
);

schema.index(
    {exp: 1},
    {expireAfterSeconds: 0}
);
schema.index({foo: 1});

const model = mongoose.model("MyModel", schema);

const cache = cacheManager.caching({
    store: mongooseStore,
    model: model
});
```

## License

MIT No Attribution

https://github.com/aws/mit-0

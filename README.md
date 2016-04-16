[![build status](https://api.travis-ci.org/disjunction/node-cache-manager-mongoose.png)](https://travis-ci.org/disjunction/node-cache-manager-mongoose)

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
    store = require("cache-manager-mongoose");

mongoose.connect("mongodb://127.0.0.1/test");

const cache = cacheManager.caching({
    store: store,
    mongoose: mongoose
});

// now you can use cache as any other cache-manager cache

```

### Options

mongoose store creates a new Model on initialization, which
you can customize as follows:

```javascript
const cache = cacheManager.caching({
    store: store,
    mongoose: mongoose,
    modelName: "MyModelName",
    modelOptions: {
        collection: "cacheman_rcp" // mongodb collection name
        versionKey: true
    }
});
```

`modelName` specifies which name will be registered in mongoose

The `modelOptions` represents the options used when creating
the Schema for the new model. You can refer to mongoose docs
for more options.

The default ones are:
```json
{
    "collection": "MongooseCache",
    "versionKey": false
}
```

### Custom model

You can also provide your own model as long as it has the same
fields as the one used by default.

In this case you don't need to provide a mongoose instance,
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
    store: store,
    model: model
});
```
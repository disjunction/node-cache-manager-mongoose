"use strict";

class MongooseStoreError extends Error {}

class MongooseStore {
    constructor(args) {
        if (!args || !(args.mongoose || args.model)) {
            throw new MongooseStoreError(
                "you MUST provide either mongoose or model instance in store args"
            );
        }

        this.mongoose = args.mongoose;
        this.modelProvider = args.connection || args.mongoose;

        if (args.model) {
            switch (typeof args.model) {
                case "object":
                    this.model = args.model;
                    break;
                case "string":
                    this.model = this.modelProvider.model(args.model);
                    break;
                default:
                    throw new MongooseStoreError("unexpected type of args.model in constructor");
            }
        } else {
            this.model = this.makeModel(args);
        }
        this.ttl = args.ttl === undefined ? 60 : args.ttl;
    }

    makeModel(args) {
        const schemaTemplate = {
            obj: {
                _id: String,
                val: this.mongoose.Schema.Types.Mixed,
                exp: Date
            },
            options: {
                collection: "MongooseCache",
                versionKey: false,
                read: "secondaryPreferred"
            }
        };

        const options = Object.assign({}, schemaTemplate.options, args.modelOptions);
        const schema = new this.mongoose.Schema(
            schemaTemplate.obj,
            options
        );

        schema.index(
            {exp: 1},
            {expireAfterSeconds: 0}
        );

        return this.modelProvider.model(args.modelName || "MongooseCache", schema);
    }

    result(fn, error, result) {
        if (fn) {
            fn(error, result);
        }
    }

    get(key, options, fn) {
        try {
            return this.model.findOne(
                {_id: key}
            )
            .then(record => {
                if (!record) {
                    return this.result(fn);
                }

                // this is necessary, since mongoose autoclean is not accurate
                if (record.exp && record.exp < new Date()) {
                    return this.del(key, null, fn);
                } else {
                    return this.result(fn, null, record.val);
                }
            })
            .catch(e => this.result(fn, e));
        } catch (e) {
            this.result(fn, e);
        }
    }

    set(key, val, options, fn) {
        try {
            options = options || {};
            let ttl = options.ttl || this.ttl;

            const doc = {val: val};
            if (this.ttl > 0) {
                doc.exp = new Date(Date.now() + ttl * 1000);
            }

            return this.model.update(
                {_id: key},
                doc,
                {upsert: true}
            )
            .then(() => this.result(fn))
            .catch(e => this.result(fn, e));
        } catch (e) {
            this.result(fn, e);
        }
    }

    del(key, options, fn) {
        try {
            return this.model.remove(
                {_id: key}
            )
            .then(() => this.result(fn));
        } catch (e) {
            this.result(fn, e);
        }
    }

    reset(key, fn) {
        try {
            if ("function" === typeof key) {
                fn = key;
                key = null;
            }
            return this.model.remove({})
                .then(() => {
                    if (fn) {
                        fn();
                    }
                });
        } catch (e) {
            this.result(fn, e);
        }
    }

    keys(fn) {
        try {
            let now = new Date();
            
            return this.model
                .find({})
                .then(records => {
                    records = records.filter(function(record) {
                        return (record.exp && record.exp > now)
                    }).map(record => record._id);

                    this.result(fn, null, records);
                })
                .catch(e => this.result(fn, e));
        }
        catch (e) {
            this.result(fn, e);
        }
    }
}

module.exports = {
    create: function (args) {
        return new MongooseStore(args);
    }
};

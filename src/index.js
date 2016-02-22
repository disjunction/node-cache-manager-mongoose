"use strict";

class MongooseStoreError extends Error {}

class MongooseStore {
    constructor(args) {
        if (!args) {
            args = {};
        }
        this.mongoose = args.mongoose || require("mongoose");

        if (args.model) {
            switch (typeof args.model) {
                case "object":
                    this.model = args.model;
                    break;
                case "string":
                    this.model = this.mongoose.model(args.model);
                    break;
                default:
                    throw new MongooseStoreError("unexpected type of args.model in constructor");
            }
        } else {
            this.model = this.makeModel(args);
        }
        this.ttl = args.ttl || 60;
    }

    makeModel(args) {
        const schemaTemplate = {
            obj: {
                _id: String,
                val: this.mongoose.Schema.Types.Mixed,
                exp: Number
            },
            options: {
                collection: "cacheman",
                versionKey: false
            }
        };

        const options = Object.assign({}, schemaTemplate.options, args.modelOptions);
        const schema = new this.mongoose.Schema(
            schemaTemplate.obj,
            options
        );

        let model = this.mongoose.model(args.model || "MongooseCache", schema);
        return model;
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
                if (record.exp < Date.now()) {
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
            
            return this.model.update(
                {_id: key},
                {
                    val: val,
                    exp: Date.now() + ttl * 1000
                },
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
            return this.model.remove({}).then(() => fn());
        } catch (e) {
            this.result(fn, e);
        }
    }
}

module.exports = {
    create: function (args) {
        return new MongooseStore(args);
    }
};

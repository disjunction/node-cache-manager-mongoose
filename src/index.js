"use strict";

const mongoose = require("mongoose");


const schemaTemplate = {
    obj: {
        _id: String,
        val: mongoose.Schema.Types.Mixed,
        exp: Number
    }, 
    options: {
        collection: "cacheman",
        versionKey: false
    }
};

const EMPTY = {};

class MongooseStoreError extends Error {};

class MongooseStore {
    constructor(args) {
        if (args.model) {
            switch (typeof args.model) {
                case "object":
                    this.model = args.model;
                    break;
                case "string":
                    this.model = mongoose.model(args.model);
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
        const options = Object.assign({}, schemaTemplate.options, args.modelOptions);
        const schema = new mongoose.Schema(
            schemaTemplate.obj,
            options
        );
        return mongoose.model(args.model, schema);
    }

    result(fn, error, result) {
        if (fn) {
            fn(error, result);
        }
    }

    get(key, options, fn) {
        return this.model.findOne({_id: key})
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
            ).then(() => {
                this.result(fn);
            }).catch(e => {
                this.result(fn, e)
            });
        } catch (e) {
            this.result(fn, e)
        }
    }

    del(key, options, fn) {

    }

    reset(key, fn) {
    }
}

module.exports = {
  create : function (args) {
    return new MongooseStore(args);
  }
};

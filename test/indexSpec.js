/* eslint-env mocha */
"use strict";

let mongoose = require("mock-mongoose").MockMongoose,
    cmm = require("../src/index"),
    cm = require("cache-manager"),
    sinon = require("sinon"),
    sinonTest = require("sinon-test"),
    expect = require("chai").expect;

const test = sinonTest(sinon);

// extend mock-mongoose with missing methods
mongoose.model = () => ({});
mongoose.Schema = function () {
    this.index = sinon.stub();
};
mongoose.Schema.Types = {};

describe("cache-manager-mongoose", function() {
    let modelStub = {
        testProp: true,
        updateOne: () => Promise.resolve(),
        findOne: () => Promise.resolve(),
        deleteOne: () => Promise.resolve(),
        deleteMany: () => Promise.resolve()
    };

    it("throws on no mongoose provided", function() {
        expect(() => {
            cm.caching({store: cmm});
        }).to.throw();
    });

    it("throws on strange model type", function() {
        expect(() => {
            cm.caching({
                store: cmm,
                mongoose: mongoose,
                model: true
            });
        }).to.throw();
    });

    it("accepts model passed directly", function() {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });
        expect(cache.store.model.testProp).to.be.true;
    });

    it("accepts model passed by name", test(function() {
        this.stub(mongoose, "model").callsFake(() => modelStub);
        let cache = cm.caching({
            store: cmm,
            mongoose: mongoose,
            model: "MyModel"
        });
        expect(cache.store.model.testProp).to.be.true;
    }));

    it("finds model if passed as string", test(function() {
        this.stub(mongoose, "model").returns({dummyField: true});
        let cache = cm.caching({
            store: cmm,
            modelName: "dummyModel",
            mongoose: mongoose
        });
        sinon.assert.calledOnce(mongoose.model);
        expect(cache.store.model.dummyField).to.be.true;
    }));

    it("creates new model if model not provided", function() {
        let cache = cm.caching({
            store: cmm,
            mongoose: mongoose
        });
        expect(cache.store.model).not.to.be.undefined;
    });

    it("set calls update", test(function(done) {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });
        let spy = this.stub(modelStub, "updateOne");
        cache.set("someKey", "someValue", null, function () {
            sinon.assert.calledOnce(spy);
            done();
        });
    }));

    it("set supports infinite ttl", test(function(done) {
        let cache = cm.caching({
            store: cmm,
            model: modelStub,
            ttl: 0
        });
        let spy = this.stub(modelStub, "updateOne");
        cache.set("someKey", "someValue", null, function () {
            sinon.assert.calledOnce(spy);
            done();
        });
    }));

    it("get calls findOne", test(function(done) {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });
        let spy = this.stub(modelStub, "findOne");
        cache.get("someKey", null, function () {
            sinon.assert.calledOnce(spy);
            done();
        });
    }));

    it("del calls deleteOne", test(function(done) {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });
        let spy = this.stub(modelStub, "deleteOne");
        cache.del("someKey", null, function () {
            sinon.assert.calledOnce(spy);
            done();
        });
    }));

    it("reset calls deleteMany", test(function(done) {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });
        let spy = this.stub(modelStub, "deleteMany");
        cache.reset(function () {
            sinon.assert.calledOnce(spy);
            done();
        });
    }));

    it("keys calls find", test(function(done) {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });

        modelStub.find = () => Promise.resolve([
            {_id: "apple"},
            {_id: "banana"}
        ]);

        cache.keys(function(error, keys) {
            expect(keys).to.deep.eql(["apple", "banana"]);
            done();
        });
    }));
});

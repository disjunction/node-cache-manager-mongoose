"use strict";

let mongoose = require("mongoose-mock"),
    proxyquire = require("proxyquire"),
    cmm = proxyquire("../src/index", {mongoose: mongoose}),
    cm = require("cache-manager"),
    sinon = require("sinon"),
    expect = require("chai").expect;

describe("cache-manager-mongoose", function() {
    let modelStub = {
        testProp: true,
        update: () => Promise.resolve(),
        findOne: () => Promise.resolve(),
        remove: () => Promise.resolve()
    };

    it("accepts model passed directly", function() {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });
        expect(cache.store.model.testProp).to.be.true;
    });

    it("finds model if passed as string", sinon.test(function() {
        this.stub(mongoose, "model").returns({dummyField: true});
        let cache = cm.caching({
            store: cmm,
            model: "dummyModel"
        });
        sinon.assert.calledOnce(mongoose.model);
        expect(cache.store.model.dummyField).to.be.true;
    }));

    it("creates new model if model not provided", function() {
        let cache = cm.caching({
            store: cmm
        });
        expect(cache.store.model).not.to.be.undefined;
    });

    it("set saves key, value, expires record", sinon.test(function(done) {
        let cache = cm.caching({
            store: cmm,
            model: modelStub
        });
        cache.set("someKey", "someValue", null, function (err, result) {
            done();
        });
        let updateSpy = sinon.stub(modelStub, "update");
        sinon.assert.calledOnce(updateSpy);
    }));
});
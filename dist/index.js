"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PrecisionTimer_instances, _PrecisionTimer_loopStart, _PrecisionTimer_resolutionNsec, _PrecisionTimer_loop;
const NANOSECONDS_IN_SEC = 1000 * 1000 * 1000;
class PrecisionTimer {
    set rps(value) {
        __classPrivateFieldSet(this, _PrecisionTimer_resolutionNsec, BigInt((NANOSECONDS_IN_SEC / value).toFixed(0)), "f");
    }
    constructor() {
        _PrecisionTimer_instances.add(this);
        _PrecisionTimer_loopStart.set(this, process.hrtime.bigint());
        _PrecisionTimer_resolutionNsec.set(this, BigInt((NANOSECONDS_IN_SEC / 3000).toFixed(0)));
        __classPrivateFieldGet(this, _PrecisionTimer_instances, "m", _PrecisionTimer_loop).call(this);
    }
    async call() {
        return new Promise((res, rej) => {
            const timeout = Math.random() * 5000;
            setTimeout(() => {
                console.log('async called with timeout', timeout);
                res();
            }, timeout);
        });
    }
}
_PrecisionTimer_loopStart = new WeakMap(), _PrecisionTimer_resolutionNsec = new WeakMap(), _PrecisionTimer_instances = new WeakSet(), _PrecisionTimer_loop = function _PrecisionTimer_loop() {
    const now = process.hrtime.bigint();
    const delta = now - __classPrivateFieldGet(this, _PrecisionTimer_loopStart, "f");
    if (delta > __classPrivateFieldGet(this, _PrecisionTimer_resolutionNsec, "f")) {
        __classPrivateFieldSet(this, _PrecisionTimer_loopStart, now, "f");
        process.nextTick(this.call.bind(this));
    }
    setImmediate(__classPrivateFieldGet(this, _PrecisionTimer_instances, "m", _PrecisionTimer_loop).bind(this));
};
new PrecisionTimer();


const NANOSECONDS_IN_SEC = 1000 * 1000 * 1000;

class PrecisionTimer {
    #loopStart = process.hrtime.bigint();
    #resolutionNsec = BigInt((NANOSECONDS_IN_SEC / 3000).toFixed(0));

    set rps(value: number){
        this.#resolutionNsec = BigInt((NANOSECONDS_IN_SEC / value).toFixed(0));
    }

    constructor(){
        this.#loop();
    }
    #loop(){
        const now =  process.hrtime.bigint();
        const delta = now - this.#loopStart;
        if (delta > this.#resolutionNsec) {
            this.#loopStart = now;
            process.nextTick(this.call.bind(this))
        }

        setImmediate(this.#loop.bind(this))
    }

    async call(){
        return new Promise<void>((res, rej) => {
            const timeout = Math.random() * 5000
            setTimeout(() => {
                res();
            }, timeout)}
        )
    }
}

new PrecisionTimer()
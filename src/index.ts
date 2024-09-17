
const MSEC_IN_SEC = 1000;
const NSEC_IN_MSEC = 1000 * 1000
const NSEC_IN_SEC = MSEC_IN_SEC * NSEC_IN_MSEC;

class PrecisionTimer {
    readonly #legacyTimer: boolean;
    readonly #basePrecisionMsec = 1;
    #interval = setTimeout(this.#loop.bind(this), this.#basePrecisionMsec);
    #loopStart = process.hrtime.bigint();
    #callsPerMsec = 1;

    /**
     * 
     * @param {number} rps requests per second 
     * @param {boolean} legacyTimer uses CPU-intensive loop instead of abusing setTimeout
     */
    constructor(rps: number, legacyTimer?: boolean){
        this.#legacyTimer = legacyTimer ?? false;
        this.rps = rps;
    }

    set rps(value: number){
        if (value <= 0) throw new Error('Requests per second must be a positive number')
        this.#callsPerMsec = Math.round(((value / MSEC_IN_SEC) + Number.EPSILON) * 100 ) / 100;
        if(!this.#legacyTimer) {
            // @ts-ignore
            this.#interval._idleTimeout = Math.round(((1 / this.#callsPerMsec) + Number.EPSILON) * 100) / 100;
            this.#interval.refresh()
        }
    }
    get rps(): number {
        return this.#callsPerMsec * MSEC_IN_SEC;
    }

    #runSubMsec(){
        const runSlotDuration = BigInt(Math.round(NSEC_IN_MSEC / this.#callsPerMsec  + Number.EPSILON));
        let startTime = process.hrtime.bigint();
        let runsLeft = this.#callsPerMsec;
        while (runsLeft > 0) {
            const now = process.hrtime.bigint();
            const delta = now - startTime;
            if (delta >= runSlotDuration) {
                this.call();
                startTime = now;
                runsLeft--;
            }
        }
    }

    #loop(){
        const now = process.hrtime.bigint()
        const delta = now - this.#loopStart;
        const shouldRun = !this.#legacyTimer ||
            delta >= BigInt(Math.round(this.#basePrecisionMsec * NSEC_IN_MSEC / this.#callsPerMsec));
        const handler = this.#legacyTimer ?this.#runSubMsec.bind(this) :  this.call.bind(this);
        if (shouldRun) {
            this.#loopStart = now;
           handler()
        }
        this.#interval.refresh()
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

new PrecisionTimer(3000, true)
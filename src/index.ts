const MSEC_IN_SEC = 1000;
const NSEC_IN_MSEC = 1000 * 1000;
const NSEC_IN_SEC = MSEC_IN_SEC * NSEC_IN_MSEC;

class PrecisionTimer {
	readonly #basePrecisionMsec = 1;
	#interval?: NodeJS.Immediate;
	#loopStart = process.hrtime.bigint();
	#callsPerMsec = 1;
	#taskCounter = 0;
	#prevTaskCounter = 0;
	#loops = 0;

    #startLoopTime = Date.now();
	public timeAvg = 0;

	/**
	 *
	 * @param {number} rps requests per second
	 */
	constructor(rps: number) {
		this.rps = rps;
		console.log('rps: ', this.rps);
	}

	set rps(value: number) {
		if (value <= 0)
			throw new Error('Requests per second must be a positive number');
		this.#callsPerMsec =
			Math.round((value / MSEC_IN_SEC + Number.EPSILON) * 100) / 100;
	}

	get rps(): number {
		return this.#callsPerMsec * MSEC_IN_SEC;
	}

	public start() {
		this.#loop();
	}

	public stop() {
		this.#interval?.unref();
		clearImmediate(this.#interval);
	}

	#loop() {
		const now = process.hrtime.bigint();
		const delta = now - this.#loopStart;
		const shouldRun =
			delta >=
			BigInt(
				Math.round(
					(this.#basePrecisionMsec * NSEC_IN_MSEC) / this.#callsPerMsec,
				),
			);
		if (shouldRun) {
			this.#loopStart = now;
			this.call();
		}
		this.#interval = setImmediate(this.#loop.bind(this));
	}

	async call() {
		this.#taskCounter++;
		if (!(this.#taskCounter % this.rps)) {
			const now = Date.now();
			const time = now - this.#startLoopTime;
			console.log(
				`LOOP: tasks=${this.#taskCounter - this.#prevTaskCounter}, time=${time}ms`,
			);
			this.#startLoopTime = now;
			this.#prevTaskCounter = this.#taskCounter;
			this.#loops++;
			this.timeAvg = (this.timeAvg * (this.#loops - 1) + time) / this.#loops;
		}

		return new Promise<void>((res, rej) => {
			const timeout = Math.random() * 5000;
			setTimeout(() => {
				res();
			}, timeout);
		});
	}
}

const test = async () => {
	const rates = [
		10, 100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
	];
	for await (const rate of rates) {
		const total = await new Promise<number>((resolve) => {
			let t = new PrecisionTimer(rate);
			t.start();
			setTimeout(() => {
				t.stop.call(t);
				resolve(t.timeAvg);
			}, 10000);
		});
		console.log('average for', rate, 'rps is', total.toFixed(2), 'msec');
	}
};

test();

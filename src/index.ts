const IS_DEBUG =
	process.env.NODE_ENV &&
	['dev', 'develop', 'debug'].includes(process.env.NODE_ENV);

const MSEC_IN_SEC = 1000;
const NSEC_IN_MSEC = 1000 * 1000;
const NSEC_IN_SEC = MSEC_IN_SEC * NSEC_IN_MSEC;
const APP_BATCH_SIZE =
	process.env.APP_BATCH_SIZE &&
	!Number.isNaN(Number(process.env.APP_BATCH_SIZE))
		? Number(process.env.APP_BATCH_SIZE)
		: 32;

type Task = () => Promise<void>;
type TaskGroup = Array<Task>;

class PrecisionTimer {
	readonly #basePrecisionMsec = 100;
	#interval?: NodeJS.Timeout;
	#taskCounter = 0;
	#prevTaskCounter = 0;
	#loops = 0;

	#startLoopTime = Date.now();
	rps: number;
	public timeAvg = 0;

	/**
	 *
	 * @param {number} rps requests per second
	 */
	constructor(rps: number) {
		this.rps = rps;
		console.log('rps: ', this.rps);
		IS_DEBUG && console.log('Batch size is', APP_BATCH_SIZE);
	}

	public start() {
		this.#loop();
	}

	public stop() {
		this.#interval?.unref();
		clearTimeout(this.#interval);
	}

	#prepareBatch(batchLength: number) {
		const jobList = new Array<Task>(batchLength).fill(this.call.bind(this));
		let taskBatch: Array<TaskGroup> = [];
		while (jobList.length > 0) {
			taskBatch.push(jobList.splice(0, APP_BATCH_SIZE));
		}
		IS_DEBUG &&
			console.log('task batch split into', taskBatch.length, 'chunks');

		const runner = () =>
			taskBatch.reduce(
				(acc, step, i) => {
					return acc.finally(() =>
						(() => {
							IS_DEBUG && console.log(i, 'step', step.length);
							return step.forEach((s) => s());
						})(),
					);
				},
				new Promise<void>((resolve) => {
					resolve(undefined);
				}),
			);
		return runner;
	}

	async #loop() {
		const jobCount = (this.rps * this.#basePrecisionMsec) / MSEC_IN_SEC;
		const batch = this.#prepareBatch(jobCount);
		batch();
		this.#interval = setTimeout(this.#loop.bind(this), this.#basePrecisionMsec);
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
				IS_DEBUG &&
					console.log(`Async task with timeout of ${timeout} completed`);
				res();
			}, timeout);
		});
	}
}

const test = async () => {
	const rates = [30000, 60000, 100000];
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

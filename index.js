const USE_FILE = true;
const { createApp, reactive } = Vue;

const studentStore = reactive({
	/** @type { string[] } */
	_students: 'abcdefghijklmnopqrstuvwxyz'.split(''),

	/**
	 * @typdef WinnerStudent
	 * @type { object }
	 * @property { string } name Student name
	 * @property { string } prize Student prize
	 */

	/** @type { WinnerStudent[] } */
	winners: [],

	getStudents() {
		return this._students.filter((n) => !this.winners.find((w) => w.name === n));
	},

	//#regeion Proper random
	_oldStudentIndex: null,
	_randomStudents: [],
	_randomizeStudents() {
		const arr = Array(this.getStudents().length)
			.fill(0)
			.map((_, i) => i);

		for (let i = arr.length - 1; i > 0; i--) {
			let swap = Math.floor(Math.random() * i);
			const temp = arr[swap];
			arr[swap] = arr[i];
			arr[i] = temp;
		}

		this._randomStudents = arr;
	},
	//#endregion
	getRandomStudent() {
		if (this._randomStudents.length <= 0) this._randomizeStudents();
		return this._randomStudents.pop();
	},

	addWinnerStudent(index, prize) {
		const student = this.getStudents().splice(index, 1)[0];
		this.winners.push({
			name: student,
			prize: prize,
		});
	},

	loadStudents(file) {
		const students = file.replace(/\r\n/g, '\n').split('\n');
		this._students = students;
	},
});

//#region Animation
const RaffleAnimationHandler = {
	RAFFLE_LENGTH: 400,
	RAFFLE_SLOW: 400 * 0.8, // RAFFLE_LENGTH * 0.8
	RAFFLE_TIME: 1,
	FPS: 1000 / 60, // 60 fps
	raffleAnimLength: 0,
	raffleAnimTime: 0,
	old_delta: -1,
	handlerAccumulator: 0,

	raffleOnFinish: () => {},
	raffleOnTick: () => {},
	inCubic: (t) => t * t * t,
	outCubic: (t) => {
		let x = t - 1;
		return x * x * x + 1;
	},
	norm: (t) => Math.max(Math.min(t, 1), 0),

	drawParticipantAnimation() {
		const p = document.getElementById('participantList');
		if (!p) return;

		// Dont animate on < 6
		if (p.children.length - 6 <= 5) {
			p.scrollTop = 0;
			return;
		}

		const h = p.children.item(p.children.length - 6);
		p.scrollTop += 1;
		if (p.scrollTop >= h.offsetTop) p.scrollTop -= h.offsetTop - 10;
	},

	updateRaffleAnimation() {
		this.raffleAnimLength--;
		if (this.raffleAnimLength > 0) {
			this.raffleAnimTime--;
			if (this.raffleAnimTime <= 0) {
				this.raffleAnimTime =
					this.RAFFLE_TIME +
					30 * this.norm(this.inCubic((this.RAFFLE_LENGTH - this.raffleAnimLength) / this.RAFFLE_SLOW));
				this.raffleOnTick();
			}
		} else {
			this.raffleAnimLength = 0;
			this.raffleOnFinish();
		}
	},

	animationHandler() {
		let new_delta = Date.now();
		this.handlerAccumulator += new_delta - this.old_delta;
		while (this.handlerAccumulator > this.FPS) {
			this.drawParticipantAnimation();
			if (this.raffleAnimLength > 0) this.updateRaffleAnimation();
			this.handlerAccumulator -= this.FPS;
		}
		this.old_delta = new_delta;

		requestAnimationFrame(() => this.animationHandler());
	},
};
//#endregion

const app = createApp({
	data() {
		return {
			studentStore,

			initialized: false,
			studentsLoaded: !USE_FILE,

			rafflePrize: '',

			showRaffleModal: false,
			fadeRaffleModal: false, // CSS Animation
			finalRaffleModal: false, // For CSS to bold out the name when the animation stops
			modalStudentIndex: -1,
		};
	},

	computed: {
		modalStudentName() {
			return this.studentStore.getStudents()[ this.modalStudentIndex ] || ''
		}
	},

	methods: {
		checkRaffle() {
			if (!this.rafflePrize.trim()) {
				alert('❗ Missing prize text');
				return;
			}

			this.openModal();
		},

		openModal() {
			this.showRaffleModal = true;
			this.fadeRaffleModal = true;
			this.finalRaffleModal = false;

			this.modalStudentIndex = -1;

			setTimeout(() => {
				RaffleAnimationHandler.raffleAnimLength = RaffleAnimationHandler.RAFFLE_LENGTH;

				RaffleAnimationHandler.raffleOnTick = () => {
					this.modalStudentIndex = this.studentStore.getRandomStudent();
				};
				RaffleAnimationHandler.raffleOnFinish = () => {
					setTimeout(() => {
						this.finalRaffleModal = true;
					}, 1000);

					setTimeout(() => {
						this.closeModal();
					}, 3000);
				};
			}, 1000);
		},
		closeModal() {
			this.fadeRaffleModal = false;

			setTimeout(() => {
				this.showRaffleModal = false;

				this.studentStore.addWinnerStudent(this.modalStudentIndex, this.rafflePrize);
				this.rafflePrize = '';

				this.$nextTick(() => {
					const list = document.getElementById('resultList');
					list.scrollTop = list.scrollHeight;
				});
			}, 250);
		},
	},

	mounted() {
		this.initialized = true;

		if (USE_FILE) {
			load_drop_handler(
				(f) => {
					studentStore.loadStudents(f);
					this.studentsLoaded = true;

					// Load animation
					this.$nextTick(() => {
						RaffleAnimationHandler.old_delta = Date.now();
						RaffleAnimationHandler.animationHandler();
					});
				},
				(e) => {
					// rafflyStore.resetStudents(e);
				}
			);
		} else {
			this.$nextTick(() => {
				RaffleAnimationHandler.old_delta = Date.now();
				RaffleAnimationHandler.animationHandler();
			});
		}
	},
});
app.mount('#app');

window.app = app;

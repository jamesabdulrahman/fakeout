/* We begin by storing some useful constants. */
const screen = document.getElementById('game_screen');
const SFX_BLIP = document.getElementById('blip');
const SFX_WIN = document.getElementById('win');
SFX_BLIP.volume = SFX_WIN.volume = 0.2;
const SCREEN_WIDTH = screen.width;
const SCREEN_HEIGHT = screen.height;
const BAT_HEIGHT = 15;
const BAT_WIDTH = 60;
const BRICK_HEIGHT = 15;
const BRICK_WIDTH = 40;
const BALL_DIA = 5;
const BAT_SPEED = 8;
const BALL_SPEED = 4;
const SCORE_INCREMENT = 40;
const CTX = screen.getContext('2d');
const SCOREBOARD = document.getElementById('scoreboard');
const LIVES = document.getElementById('lives');
const LEVEL = document.getElementById('level')

class Fakeout {
	/* This function creates the main game object.
	 * It would typically be called with new Fakeout(). */
	constructor() {
		/* The scene is the function that we want to call as the
		 * game loop. This could be the title screen, main play
		 * screen, scoreboard and so forth. Whatever function is
		 * set as the scene will be called approximately 60 times
		 * per second, just like a good old-fashioned NTSC TV! */
		this.scene = this.title;

		/* Every time we start a new game, we need to reset all
		 * the variables which represent the game state. */
		this.initialize();

		/* VERY IMPORTANT! Finally, we establish event listeners
		 * on the browser window object, so we can listen out for
		 * key inputs so players can actually control the game.
		 * Note that these are properties of the BROWSER WINDOW,
		 * NOT THIS CLASS. */
		window.addEventListener('keydown', (e) => {
			this.controller[e.keyCode] = true;
		});

		window.addEventListener('keyup', (e) => {
			this.controller[e.keyCode] = false;
		});
	}

	initialize() {
		/* These variables are to represent the game
		 * state, which determines how the game evolves
		 * over each refresh. */
		this.controller = {};
		this.score = 0;
		this.lives = 4;
		this.level = 1;
		/* Set up the breakable bricks. */
		this.bricks = [];
		let colLimit = BRICK_HEIGHT*12;
		let rowLimit = BRICK_WIDTH*14;
		for (let cx = BRICK_WIDTH*2; cx <= rowLimit; cx += BRICK_WIDTH) {
			for (let cy = BRICK_HEIGHT*6; cy <= colLimit; cy += BRICK_HEIGHT) {
				this.bricks.push({x: cx, y: cy, h: BRICK_HEIGHT, w: BRICK_WIDTH, smashed: false});
			}
		}

		/* These should be self-explanatory. They hold the
		 * key properties and state of the game objects.
		 * Note that x and y refer to the CENTRE POSITION
		 * of the object. */
		this.ball = {x: screen.width/2, y: 0, h: BALL_DIA, w: BALL_DIA, velX: 0, velY: 0, active: false};
		this.bat = {x: screen.width/2, y: 440, h: BAT_HEIGHT, w: BAT_WIDTH};
	}

	run() {
		this.controls(); // Grab current control inputs.
		CTX.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // Blank the screen.
		this.writeScoreboard();
		LIVES.innerHTML = this.lives;
		LEVEL.innerHTML = this.level;
		this.scene(); // Run the current game screen for one frame.
		/* Now one game frame is over, so we request that this
		 * function is run again in about 1/60th of a second.
		 * The browser handles this automatically. */
		let nextCall = () => {this.run();};
		window.requestAnimationFrame(nextCall);
	}

	writeScoreboard() {
		let places = 10;
		let score = '' + this.score;
		while (score.length < places) {
			score = '0' + score;
		}
		SCOREBOARD.innerHTML = score;
	}

	title() {
		let ctx = screen.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.strokeStyle = 'black';
		ctx.font = '132pt Baumans';
		ctx.textAlign = 'center';
		ctx.fillText('Fakeout', SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
		ctx.font = '16pt Baumans';
		ctx.fillText('BATTLE THE BRICKS!', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 40);
		ctx.fillText('Ⓒ 2016-2017 James Abdul Rahman Brierley', SCREEN_WIDTH/2, SCREEN_HEIGHT-60);
	}

	play() {
		/* Save the context and set some game variables for
		 * drawing to the canvas. */
		let ctx = screen.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.strokeStyle = '1px gray';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = 2;
		/* Note that in the method calls below, 'this' refers
		 * to the game object. */
		this.update(); // Update the game state.
		if (this.ball.active === true) {
			 /* Check if the ball is in play.
			  * If it is, draw it based on its current position. */
			this.drawBall(ctx, this.ball.x, this.ball.y);
		}
		this.drawBricks(ctx);
		/* Draw both bats based on the current game state. */
		this.drawBat(ctx, this.bat.x, this.bat.y);

	}

	gameOver() {
		let ctx = screen.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.font = '72pt Baumans';
		ctx.textAlign = 'center';
		ctx.fillText('Game Over', SCREEN_WIDTH/2, SCREEN_HEIGHT/3);
		ctx.font = '16pt Baumans';
		ctx.fillText('Are you a bad enough dude to play again? (Press Enter)', SCREEN_WIDTH/2, SCREEN_HEIGHT/4+200);
	}

	wallDestroyed() {
		for (let brick of this.bricks) {
			if (brick.smashed === false) {
				return false;
			}
		}
		return true;
	}

	controls() {
		/* Read the controller object, updated by event listeners
		 * that the constructor attaches to the window object, and
		 * change game state as appropriate. */
		if (this.scene === this.play) {
			// If we’re in a game...
			if (this.controller[KEY_LEFT] === true) {
				if (this.bat.x-this.bat.w/2 > 0) {
					this.bat.x -= BAT_SPEED;
				}
				else {
					this.bat.x = this.bat.w/2;
				}
			}
			if (this.controller[KEY_RIGHT] === true) {
				if (this.bat.x+this.bat.w/2 < SCREEN_WIDTH) {
					this.bat.x += BAT_SPEED;
				}
				else {
					this.bat.x = SCREEN_WIDTH - this.bat.w/2;
				}
			}
			if (this.controller[KEY_SPACE] === true) {
				if (this.ball.active === false) {
					this.serve();
				}
			}
		}
		if (this.scene === this.title || this.scene === this.gameOver) {
			// If we’re on the title or win screen...
			if (this.controller[KEY_ENTER] === true) {
				this.initialize();
				this.scene = this.play;
			}
		}
	}

	drawBat(ctx, cx, cy) {
		ctx.fillRect(cx-BAT_WIDTH/2, cy-BAT_HEIGHT/2, this.bat.w, this.bat.h);
	}

	drawBall(ctx, cx, cy) {
		ctx.fillRect(cx-BALL_DIA/2, cy-BALL_DIA/2, this.ball.w, this.ball.h);
	}

	drawBricks(ctx) {
		for (let brick of this.bricks) {
			if (brick.smashed === false) {
				ctx.fillRect(brick.x-brick.w/2, brick.y-brick.h/2, BRICK_WIDTH, BRICK_HEIGHT);
				ctx.strokeRect(brick.x-brick.w/2, brick.y-brick.h/2, BRICK_WIDTH, BRICK_HEIGHT);
			}
		}
	}

	update() {
		/* This is the core of the game logic, updating the
		game's state on each call to play(). Many games are
		programmed to separate content and style, so to speak,
		and this is one of them. This is the first thing that
		happens at the beginning of each refresh frame, before
		any drawing goes on. */
		if (this.ball.active === true) {
			/* Update the ball's position. */
			this.ball.x += this.ball.velX;
			this.ball.y += this.ball.velY;
	 		/* If the ball is hitting the bat... */
	 		if (this.collision(this.bat, this.ball) === true) {
	 			this.ball.velX = (BALL_SPEED * (this.ball.x-this.bat.x)/13);
	 			this.ball.y -= this.bat.h/2;
	 			this.ball.velY = -this.ball.velY;
	 		}
			if (this.hittingCeiling() === true) {
				this.ball.velY = -this.ball.velY;
			}
			if (this.hittingLeft() === true) {
				this.ball.velX = -this.ball.velX;
			}
			if (this.hittingRight() === true) {
				this.ball.velX = -this.ball.velX;
			}
			/* Has the ball gone off the bottom of the screen?
			If so, it's no longer in play. */
			if (this.outOfBounds() === true) {
				this.lives--;
				this.ball.active = false;
				this.ball.velX = 0;
			}
			/* Now, we want to check if the ball is colliding with any breakable blocks. */
			for (let brick of this.bricks) {
				if ((brick.smashed === false) && (this.collision(brick, this.ball))) {
					brick.smashed = true;
					this.score += SCORE_INCREMENT * this.level;
					this.ball.velX = (BALL_SPEED * (this.ball.x-brick.x)/13);
					this.ball.velY = -this.ball.velY;
					// Don't let us break more than one
					break;
				}
			}
		}
		// We are still alive, right?
		if (this.lives === 0) {
			this.scene = this.gameOver;
		}
		/* Have we destroyed all the bricks? */
		if (this.wallDestroyed() === true) {
			this.level++;
			ball.active = false;
		}
	}

	collision(a, b) {
		return !(a.x + a.w/2 < b.x - b.w/2 ||
			 a.y + a.h/2 < b.y - b.h/2 ||
			 a.x - a.w/2 > b.x + b.w/2 ||
			 a.y - a.h/2 > b.y + b.h/2);
	}

	hittingCeiling() {
		return ((this.ball.y - BALL_DIA/2) < 0);
	}

	hittingLeft() {
		return ((this.ball.x - BALL_DIA/2) < 0);
	}

	hittingRight() {
		return ((this.ball.x + BALL_DIA/2) > SCREEN_WIDTH);
	}

	outOfBounds() {
		return ((this.ball.y + BALL_DIA) > SCREEN_HEIGHT);
	}

	serve() {
		this.ball.active = true; // The ball is now in play.
		/* Drop the ball off on the bat. */
		this.ball.x = this.bat.x;
		this.ball.y = this.bat.y-BAT_HEIGHT*8;
		this.ball.velY = BALL_SPEED; // Reset the Y velocity.
	}
}

var game = new Fakeout();
game.run();

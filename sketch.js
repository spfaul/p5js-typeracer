// Enum workaround for js, too lazy to use ts
const gameStates = Object.freeze({
	START_MENU: Symbol("START_MENU"),
	RACING: Symbol("RACING")
});
var currGameState = gameStates.START_MENU;
var goalStr, goalStrLen;
var goalStrDictionary;
var typoStr = ""; // to be displayed to user
const MAX_TYPO_CHARS_DISPLAY = 30; // typo string has scrolling effect to accomadate indefinite error length
var startBtn;
var startTime;
var gameAttempt = {
	typoCount: 0,
	secsElapsed: null,
	wpm: null,
	prompt: null
}; // keep track of current game attempt info
// load highscore from localstorage
var highScoreAttempt;
if (localStorage.getItem("highscore") === null) {
		highScoreAttempt = null;
} else {
		highScoreAttempt = JSON.parse(localStorage.getItem("highscore"));
}

function preload() {
	// fetch our wordlist in preload since loadJSON is async
	// goalStrDictionary = loadJSON("https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/english_1k.json");
	goalStrDictionary = loadJSON("https://raw.githubusercontent.com/spfaul/p5js-typeracer/master/words.json");
}

function setup() {
	createCanvas(1000, 600);
	textFont("Fira Sans", 24); // added in HTML
	startBtn = new Button(
		400, 200, 1000-800, 50,
		game_preinit,
	 	{
			text: "Start",
			textSize: 30,
			hoverColor: color(200,100,100)
		}
	);
}

function game_preinit() {
	currGameState = gameStates.RACING;
	let tmpWordArr = [];
	for (i=0; i<10; i++)
		tmpWordArr.push(goalStrDictionary.words[Math.floor(Math.random()*goalStrDictionary.words.length)]);
	goalStr = tmpWordArr.join(" ");
	gameAttempt = {
		typoCount: 0,
		secsElapsed: null,
		wpm: null,
		prompt: goalStr
	};
	goalStrLen = goalStr.length;
	startTime = new Date();
}

function draw() {
	if (currGameState == gameStates.START_MENU) {
		drawMenu();
	} else if (currGameState == gameStates.RACING) {
		drawRace();
	}
}

function keyPressed(kc) {
	if (currGameState != gameStates.RACING)
		return;
	if (kc.code === "Backspace" && typoStr.length)
		typoStr = typoStr.substring(0, typoStr.length-1);
}

function keyTyped(keyEvent) {
		if (currGameState != gameStates.RACING)
				return;
		if (typoStr.length) {
			typoStr += keyEvent.key;
			return;
		}

		if (keyEvent.key === goalStr[0]) {
			goalStr = goalStr.substring(1);
			return;
		}

		gameAttempt.typoCount += 1;
		typoStr += keyEvent.key; 
}

class Button {
	constructor(x, y, w, h, onPress, opts) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.onPress = onPress;
		this.opts = opts;
	}

	update() {
		let isHover = (mouseX > this.x && mouseX < this.x + this.w
									&&
									mouseY > this.y && mouseY < this.y + this.h);
		if (isHover && this.opts.hoverColor)
			fill(this.opts.hoverColor);
		else if (this.opts.defaultColor)
			fill(this.opts.defaultColor);
		else
			fill(color(240,240,240));
		let isClick = (mouseIsPressed && mouseButton === LEFT);
		let isTouch = false;
		for (let i=0; i<touches.length; i++) {
			if (touches[i][0] > this.x && touches[i][0] < this.x + this.w
				&&
				touches[i][1] > this.y && touches[i][1] < this.y + this.h) {
				isTouch = true;
				break;
			}
		}
		if ((isHover && isClick) || isTouch)
			this.onPress();
		
		rect(this.x, this.y, this.w, this.h, 20);

		if (this.opts.text && this.opts.textSize) {
			textSize(this.opts.textSize);
			textAlign(CENTER, CENTER);
			fill(color(0,0,0));
			text(this.opts.text, this.x, this.y, this.w, this.h);
		}
	}
};

function drawMenu() {
	background(color("#453C67"));
	startBtn.update();
	if (gameAttempt.secsElapsed) {
		fill(color("#F2F7A1"));
		prevAttemptStats = "Attempt Stats\n\n\n" +
												`Time Taken: ${gameAttempt.secsElapsed.toFixed(2)}s\n` +
												`Typo Count: ${gameAttempt.typoCount}\n` +
												`WPM: ${gameAttempt.wpm.toFixed(2)}`;
		textAlign(LEFT);
		text(prevAttemptStats, 50, 50, 300, 400);
	}
	if (highScoreAttempt !== null) {
		fill(color("#F2F7A1"));
		highScoreAttemptStats = "Highscore\n\n\n" +
												`Time Taken: ${highScoreAttempt.secsElapsed.toFixed(2)}s\n` +
												`Typo Count: ${highScoreAttempt.typoCount}\n` +
												`WPM: ${highScoreAttempt.wpm.toFixed(2)}`;
		textAlign(LEFT);
		text(highScoreAttemptStats, 700, 50, 300, 400);		
	}

}

function drawRace() {
	if (goalStr.length === 0) {
		endGame();
		return;
	}
	background(color("#453C67"));
	// prog bar
	let unfinished_percentage = goalStr.length / goalStrLen; 
	fill(color(10, 200, 10));
	rect(100, 100, (1-unfinished_percentage)*(1000-200), 40);
	fill(color("#6D67E4"));
	rect((1-unfinished_percentage)*(1000-200)+100, 100, unfinished_percentage*(1000-200), 40);

	// text progress + error chars
	textSize(35);
	textAlign(LEFT, TOP);
	fill(color("#46C2CB"));
	text("> "+goalStr, 100, 300, 1000-200, 300);
	if (typoStr.length) {
		fill(color(200, 10, 10, 100));
		let windowedStr = typoStr.substring(typoStr.length-MAX_TYPO_CHARS_DISPLAY, typoStr.length);
		text(windowedStr+" <", 100, 250, 1000-200, 50);
	}

	// timer
	fill(color("#F2F7A1"));
	textAlign(CENTER, TOP);
	text(`Time elapsed: ${((new Date() - startTime)/1000).toFixed(2)}s\n` +
				`Typo Count: ${gameAttempt.typoCount}\n`
					, 0, 0, 1000, 300);
}

function endGame() {
	// calculate attempt stats and store before returning to menu
	gameAttempt.secsElapsed = (new Date() - startTime) / 1000;
	gameAttempt.wpm = gameAttempt.prompt.split(" ").length / (gameAttempt.secsElapsed / 60);
	if (highScoreAttempt === null || gameAttempt.wpm > highScoreAttempt.wpm) {
		highScoreAttempt = gameAttempt;
		localStorage.setItem("highscore", JSON.stringify(gameAttempt));
	}
	currGameState = gameStates.START_MENU;
}

/*
Primary sources:
- Intersection points between circles: http://csharphelper.com/blog/2014/09/determine-where-two-circles-intersect-in-c/
- Computing regions: https://arxiv.org/pdf/1204.3569.pdf
*/

let radicalLines = {};
let radicalIntersections = [];

let globalIndex = 0;
class Circle {
	constructor(p, x, y) {
		this.p = p;
		this.index = globalIndex++;
		this.x = x;
		this.y = y;
		this.r = 100;
		// Original X and Y; used when dragging
		this.ox = x;
		this.oy = y;
		this.c = this.p.color(255, 0, 0);
		this.oc = this.p.color(0, 0, 0);
	}

	draw = gp => {
		if (gp.ShowCircles) {
			this.p.fill(this.p.color('rgba(0,0,0,0.1)'));
			this.p.stroke(this.c);
			this.p.strokeWeight(1);
			this.p.circle(this.x, this.y, this.r * 2); // p5js uses the diameter
		}
	}
}

const s = (sketch) => {
	var guiParams = {
		ShowCircles: true,
	}
	var gui;

	sketch.setup = () => {
		sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);
		gui = sketch.createGui(sketch, "Circle workbench");
		gui.addObject(guiParams);
	}
	
	sketch.windowResized = () => {
		sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
	}

	let circles = [];

	sketch.draw = () => {
		sketch.background(220);
		circles.forEach(c => {
			c.draw(guiParams);
		});
		interestingPoints.forEach(p=>{sketch.circle(p.x, p.y, 3)});
		
		sketch.noLoop();
	}

	let candidates = [];

	// Only called when moved AND NOT mouse pressed
	sketch.mouseMoved = event => {
		candidates = [];
		if (!sketch.validMouseTarget(event)) {
			circles.forEach(c => {
				c.c = sketch.color(0, 0, 0);
			});
			return;
		}
		circles.forEach(c => {
			if (sketch.dist(sketch.mouseX, sketch.mouseY, c.x, c.y) > c.r) {
				c.c = sketch.color(0, 0, 0);
				return;
			}
			c.c = sketch.color(255, 0, 0);
			candidates.push(c);
		});
		sketch.loop();
	}

	let startX = -1;
	let startY = -1;

	sketch.mousePressed = event => {
		if (!sketch.validMouseTarget(event)) {
			startX = startY = -1;
			return;
		}
		startX = sketch.mouseX;
		startY = sketch.mouseY;
		sketch.loop();
	}

	sketch.validMouseTarget = event => {
		return event.target.className == "p5Canvas";
	}

	let hasDragged = false;
	sketch.mouseDragged = event => {
		if (startX < 0) {
			return;
		}
		clearTimeout(delayHandle);
		hasDragged = true;
		candidates.forEach(c => {
			c.x = c.ox + sketch.mouseX - startX;
			c.y = c.oy + sketch.mouseY - startY;
		});
		sketch.refreshTable();
	}

	sketch.mouseReleased = event => {
		if (!sketch.validMouseTarget(event)) {
			return;
		}
		if (!sketch.fullscreen()) {
			//sketch.fullscreen(true);
		}

		if (hasDragged) {
			hasDragged = false;
			candidates.forEach(c => {
				c.ox = c.x;
				c.oy = c.y;
			});
		} else {
			circles.push(new Circle(sketch, sketch.mouseX, sketch.mouseY));
		}

		sketch.refreshTable();
		return false;
	}

	sketch.mouseWheel = (event) => {
		candidates.forEach(c => {
			c.r -= event.delta;
		});
		sketch.refreshTable();
	}

	this.delayHandle = null;

	sketch.refreshTable = () => {
		sketch.loop();
		clearTimeout(this.delayHandle);
		this.delayHandle = setTimeout(sketch._refreshTable, 20);
	}
	
	let interestingPoints = [];
	sketch._refreshTable = () => {
		interestingPoints = [];
		let hhCircles = [];
		circles.forEach(c => {
			hhCircles.push(new circleRegions.circle({radius: c.r, x: c.x, y: c.y}, c.index));
		});
		let hhResult = circleRegions.getIntersectionAreas(hhCircles);
		hhResult.areas.forEach(a => {
			if (a.isCircle) {
				return;
			}
			
			a.arcs.forEach(a=>{
				interestingPoints.push({x: a.mx, y: a.my});
			});
		});
		console.log("hhResult", hhResult);
		sketch.loop();
	}
	
}

let myp5 = new p5(s);

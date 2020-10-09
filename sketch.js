/*
Primary sources:
- Intersection points between circles: http://csharphelper.com/blog/2014/09/determine-where-two-circles-intersect-in-c/
- Computing regions: https://arxiv.org/pdf/1204.3569.pdf
- Computing regions: https://hogg.io/writings/circle-intersections
*/

let radicalLines = {};
let radicalIntersections = [];

let globalIndex = 0;
class SketchCircle {
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
	let interestingPoints = {
		ShowMidArcs: {
			color: "#F63",
			size: 5,
			points: []
		},
		ShowEndArcs: {
			color: "#36F",
			size: 5,
			points: []
		},
		ShowAvgRegions: {
			color: "#6F3",
			size: 10,
			points: []
		},
	};

	var guiParams = {
		ShowCircles: true,
		ShowMidArcs: true,
		ShowEndArcs: true,
		ShowAvgRegions: true,
		LogRegions: false,
		ColorDebug: false,
		ColorShift: 1,
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
		let colorMultiplier = 40;
		if (this.graph === undefined) {
			return;
		}
		sketch.noFill();
		sketch.ellipseMode(sketch.RADIUS);
		this.graph.regions.forEach(region => {
			region.arcs.forEach(arc => {
				sketch.arc(arc.circle.center.x, arc.circle.center.y, arc.circle.radius, arc.circle.radius, arc.startAngle, arc.endAngle, arc.startAngle<arc.endAngle);
			})
		})
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
			circles.push(new SketchCircle(sketch, sketch.mouseX, sketch.mouseY));
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
		sketch._refreshTable();
		return;
		sketch.loop();
		clearTimeout(this.delayHandle);
		this.delayHandle = setTimeout(sketch._refreshTable, 5);
	}
	
	sketch._refreshTable = () => {
		interestingPoints.ShowMidArcs.points = [];
		interestingPoints.ShowEndArcs.points = [];
		interestingPoints.ShowAvgRegions.points = [];
		this.graph = new circleRegions.Graph();
		circles.forEach(c => {
			this.graph.addCircle(new circleRegions.Circle({x:c.x, y:c.y}, c.r));
		});
		sketch.loop();
	}
}

let myp5 = new p5(s);

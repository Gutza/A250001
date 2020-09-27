let globalIndex = 0;
class Circle {
	constructor(p, x, y) {
		this.p = p;
		this.index = globalIndex++;
		this.x = x;
		this.y = y;
		this.r = 100;
		// Interesting points on this circle
		this.intersections = [];
		// Original X and Y; used when dragging
		this.ox = x;
		this.oy = y;
		this.c = this.p.color(255, 0, 0);
		this.oc = this.p.color(0, 0, 0);
	}

	draw = () => {
		this.p.fill(this.p.color('rgba(0,0,0,0.1)'));
		this.p.stroke(this.c);
		this.p.circle(this.x, this.y, this.r * 2); // p5js uses the diameter
		
		this.p.fill(this.p.color(255, 255, 255));
		this.p.stroke(this.oc);
		this.intersections.forEach(i => {
			if (this.index < i) {
				return;
			}
			this.p.circle(i.int1.x, i.int1.y, 5);
			this.p.circle(i.int2.x, i.int2.y, 5);
		});
	}

	// http://csharphelper.com/blog/2014/09/determine-where-two-circles-intersect-in-c/
	relationTo = c => {
		let centerDist = this.p.dist(this.x, this.y, c.x, c.y);
		if (centerDist > this.r + c.r) {
			return {
				rel: "disjunct"
			};
		}

		if (centerDist + this.r < c.r) {
			return {
				rel: "this in that"
			};
		}

		if (centerDist + c.r < this.r) {
			return {
				rel: "that in this"
			};
		}

		// Find a and h
		let a = (this.r * this.r - c.r * c.r + centerDist * centerDist) / (2 * centerDist);
		let h = Math.sqrt(this.r * this.r - a * a);

		// Find P2
		let cx2 = this.x + a * (c.x - this.x) / centerDist;
		let cy2 = this.y + a * (c.y - this.y) / centerDist;

		let result = {
			rel: "intersection",
			int1: this.p.createVector(
				cx2 + h * (c.y - this.y) / centerDist,
				cy2 - h * (c.x - this.x) / centerDist
			),
			int2: this.p.createVector(
				cx2 - h * (c.y - this.y) / centerDist,
				cy2 + h * (c.x - this.x) / centerDist
			)
		};
		this.intersections[c.index] = {
			int1: result.int1,
			int2: result.int2,
		};
		c.intersections[this.index] = {
			int1: result.int1,
			int2: result.int2,
		};
		return result;
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
			c.draw();
		});
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
		clearTimeout(this.delayHandle);
		this.delayHandle = setTimeout(sketch._refreshTable, 20);
	}
	
	sketch._refreshTable = () => {
		circles.forEach(cThis => {
			cThis.intersections = [];
		});
		
		circles.forEach(cThis => {
			circles.forEach(cThat => {
				if (cThis.index >= cThat.index) {
					return;
				}
				let r = cThis.relationTo(cThat);
				if (r.rel == "disjunct") {
					return;
				}
			});
		});
	}
}

let myp5 = new p5(s);

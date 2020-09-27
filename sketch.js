var showCircles = true;
var gui;

function setup() {
  //createCanvas(displayWidth, displayHeight);
  createCanvas(800, 800);
  gui = createGui('Circles!');
  gui.addGlobals('showCircles');
}

let circles = [];
let globalIndex = 0;
class Circle {
  constructor(x, y) {
    this.index = globalIndex++;
    this.x = x;
    this.y = y;
    this.r = 100;
    // Interesting points on this circle
    this.intersections = [];
    // Original X and Y; used when dragging
    this.ox = x;
    this.oy = y;
    this.c = color(255, 0, 0);
  }

  draw() {
    fill(color('rgba(0,0,0,0.1)'));
    stroke(this.c);
    circle(this.x, this.y, this.r * 2); // p5js uses the diameter
    
    noFill();
    this.intersections.forEach(i => {
      circle(i.int1.x, i.int1.y, 5);
      circle(i.int2.x, i.int2.y, 5);
    });
  }

  // http://csharphelper.com/blog/2014/09/determine-where-two-circles-intersect-in-c/
  relationTo(c) {
    let centerDist = dist(this.x, this.y, c.x, c.y);
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
    let h = sqrt(this.r * this.r - a * a);

    // Find P2
    let cx2 = this.x + a * (c.x - this.x) / centerDist;
    let cy2 = this.y + a * (c.y - this.y) / centerDist;

    let result = {
      rel: "intersection",
      int1: createVector(
        cx2 + h * (c.y - this.y) / centerDist,
        cy2 - h * (c.x - this.x) / centerDist
      ),
      int2: createVector(
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

// both draw() and redraw() are reserved
function draw() {
  background(220);
  circles.forEach(c => {
    c.draw();
  });
}

let candidates = [];

// Only called when moved AND NOT mouse pressed
function mouseMoved() {
  candidates = [];
  circles.forEach(c => {
    if (dist(mouseX, mouseY, c.x, c.y) > c.r) {
      c.c = color(0, 0, 0);
      return;
    }
    c.c = color(255, 0, 0);
    candidates.push(c);
  });
}

let startX = 0;
let startY = 0;

function mousePressed() {
  startX = mouseX;
  startY = mouseY;
}

let hasDragged = false;

function mouseDragged() {
  candidates.forEach(c => {
    c.x = c.ox + mouseX - startX;
    c.y = c.oy + mouseY - startY;
  });
  hasDragged = true;
  refreshTable();
}

function mouseReleased() {
  if (!fullscreen()) {
    //fullscreen(true);
  }

  if (hasDragged) {
    hasDragged = false;
    candidates.forEach(c => {
      c.ox = c.x;
      c.oy = c.y;
    });
  } else {
    circles.push(new Circle(mouseX, mouseY));
  }

  refreshTable();
  return false;
}

function mouseWheel(event) {
  candidates.forEach(c => {
    c.r -= event.delta;
  });
  refreshTable();
}

function refreshTable() {
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
      console.log(cThis.index, cThat.index, r);
    });
  });
}

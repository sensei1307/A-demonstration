let grid = [];

let row = 40;
let unit = 14;

let toolsel;
let diag;
let distype;

let mapseed = 0;

let delayy = 15;

let start = [0, 0];
let end = [row - 1, row - 1];

let cost = [1, 1.4, 1, 1.4, 1, 1.4, 1, 1.4];
let circ = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

let button;

let openset = [];
let closedset = [];

let finalpath = [];

let blipsound;

function setup() {
  
  soundFormats('wav');
  blipsound = loadSound('/blipSelect.wav');
  
  mapseed = random(200, 9999);

  for (let x = 0; x < row; x++) {
    grid.push([]);

    for (let y = 0; y < row; y++) {
      grid[x].push([0]);
    }
  }

  createCanvas(row * unit, row * unit);

  const yyy = 196;

  let controlDiv = select("#controls");

  toolsel = createSelect();
  toolsel.option("Start");
  toolsel.option("End");
  toolsel.option("Obstacle");
  toolsel.option("Erase obstacle");
  toolsel.parent(controlDiv);

  let gen = createButton("generate obstacles");
  gen.mousePressed(generate);
  gen.style("display", "inline");
  gen.parent(controlDiv);

  let stp = createButton("step");
  stp.style("display", "inline");
  stp.mousePressed(step);
  stp.parent(controlDiv);

  let re = createButton("reset");
  re.style("display", "inline");
  re.mousePressed(reset);
  re.parent(controlDiv);

  let as = createButton("auto explore");
  as.style("display", "inline");
  as.mousePressed(auto_explore);
  as.parent(controlDiv);

  let co = createButton("clear obstacles");
  co.style("display", "inline");
  co.mousePressed(clr_obs);
  co.parent(controlDiv);

  diag = createCheckbox("Allow diagonal movement", true);
  diag.style("display", "block");
  diag.parent(controlDiv);

  distype = createSelect();
  distype.style("display", "block");
  distype.option("Euclidean distance");
  distype.option("Manhattan distance");
  distype.selected("Euclidean distance");
  distype.parent(controlDiv);
  
}

function reset() {
  finalpath = [];
  openset = [];
  closedset = [];

  for (let x = 0; x < row; x++) {
    for (let y = 0; y < row; y++) {
      if (grid[x][y][0] != 1) {
        grid[x][y][0] = 0;
      }
    }
  }
}

function clr_obs() {
  for (let x = 0; x < row; x++) {
    for (let y = 0; y < row; y++) {
      if (grid[x][y][0] == 1) {
        grid[x][y][0] = 0;
      }
    }
  }
}

function exists(x, y) {
  if (x >= 0 && x < row && y >= 0 && y < row) {
    return true;
  } else {
    return false;
  }
}

function distt(x1, y1, x2, y2) {
  let t = distype.selected();

  if (t == "Euclidean distance") {
    return dist(x1, y1, x2, y2);
  } else if (t == "Manhattan distance") {
    return abs(x1 - x2) + abs(y1 - y2);
  }
}

function drawgrid() {
  if (diag.checked() == false) {
    cost = [1, 1, 1, 1];
    circ = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
  } else {
    cost = [1, 1.4, 1, 1.4, 1, 1.4, 1, 1.4];
    circ = [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ];
  }

  stroke(color(0, 0, 0, 30));

  for (let x = 0; x < row; x++) {
    for (let y = 0; y < row; y++) {
      let c = grid[x][y][0];

      if (c == 0) {
        fill(color(255, 255, 255)); //empty
      } else if (c == 1) {
        fill(color(0, 0, 0)); //wall
      } else if (c == 2) {
        fill(color(0, 200, 0)); //open
      } else if (c == 3) {
        fill(color(200, 0, 0)); //closed
      } else if (c == 4) {
        fill(color(0, 162, 255)); //path
      }

      rect(x * unit, y * unit, unit, unit);
    }
  }

  fill(color(255, 255, 0)); // start
  rect(start[0] * unit, start[1] * unit, unit, unit);

  fill(color(255, 0, 255)); // end
  rect(end[0] * unit, end[1] * unit, unit, unit);

  let ssx = floor(mouseX / unit);
  let ssy = floor(mouseY / unit);

  noFill();
  stroke(color(0, 0, 0));

  rect(ssx * unit, ssy * unit, unit, unit);

  stroke(color(0,0,255));
  strokeWeight(4);

  for (let i = 0; i < finalpath.length - 3; i += 2) {
    let x1 = finalpath[i] * unit + unit / 2;
    let y1 = finalpath[i + 1] * unit + unit / 2;
    let x2 = finalpath[i + 2] * unit + unit / 2;
    let y2 = finalpath[i + 3] * unit + unit / 2;

    line(x1, y1, x2, y2);
  }
  
  strokeWeight(1);

}

function mouseClicked() {
  
  drawwall();
  
  let ssx = floor(mouseX / unit);
  let ssy = floor(mouseY / unit);

  if (exists(ssx, ssy)) {
    let tool = toolsel.value();

    if (tool == "Start") {
      start = [ssx, ssy];
    }
    if (tool == "End") {
      end = [ssx, ssy];
    }
  }
}

function mouseDragged() {
  drawwall();
}

function drawwall(){
  
  let ssx = floor(mouseX / unit);
  let ssy = floor(mouseY / unit);
  
  let tool = toolsel.value();

  if (exists(ssx, ssy)) {
    if (tool == "Obstacle") {
      if (grid[ssx][ssy][0] == 0) {
        grid[ssx][ssy][0] = 1;
      }
    }

    if (tool == "Erase obstacle") {
      if (grid[ssx][ssy][0] == 1) {
        grid[ssx][ssy][0] = 0;
      }
    }
  }
}

function generate() {
  reset();

  let sc = 2;

  mapseed += 1;

  for (let x = 0; x < row; x++) {
    for (let y = 0; y < row; y++) {
      grid[x][y][0] = floor(noise(x * sc, y * sc, mapseed) + 0.4);
    }
  }
}

function encode(x, y) {
  return str(x) + "_" + str(y);
}

function traceback(x, y) {
  
  grid[x][y][0] = 4;

  finalpath.push(x);
  finalpath.push(y);

  let found = closedset.find((obj) => obj.x === x && obj.y === y);

  if (x != start[0] || y != start[1]) {
    setTimeout(
      function a() {
        traceback(found.px, found.py);
      },

      delayy
    );
  }
}

function step() {
  let endblock;

  //if no open nodes, put starting node into open
  if (openset.length == 0) {
    openset.push({
      x: start[0],
      y: start[1],
      g: 0,
      h: distt(start[0], start[1], end[0], end[1]),
      px: start[0],
      py: start[1],
    });
  }

  //pick the best open node firsst
  let bestcost = 9999;
  let bestblock = [];

  for (let i in openset) {
    let block = openset[i];

    let ng = block.g;
    let nh = block.h;
    let nc = ng + nh;

    if (nc < bestcost) {
      bestcost = nc;
      bestblock = [i];
    }
  }

  //shift best block to closed set.

  for (let f in bestblock) {
    let blockid = bestblock[f];
    let block = openset[blockid];

    grid[block.x][block.y][0] = 3;

    closedset.push(block);
    openset.splice(blockid, 1);

    //check neighbors to add to open

    for (let k in circ) {
      let nx = block.x + circ[k][0];
      let ny = block.y + circ[k][1];

      if (exists(nx, ny)) {
        if (grid[nx][ny][0] != 1 && (nx == end[0] && ny == end[1]) == false) {
          let inclosed = closedset.find((obj) => obj.x === nx && obj.y === ny);
          let inopen = openset.find((obj) => obj.x === nx && obj.y === ny);

          if (inopen == undefined && inclosed != undefined) {
            
            //is in open 
            
          } else if (inopen == undefined && inclosed == undefined) {
            grid[nx][ny][0] = 2;

            openset.push({
              x: nx,
              y: ny,
              g: block.g + cost[k],
              h: distt(nx, ny, end[0], end[1]),
              px: block.x,
              py: block.y,
            });
          }else if (inopen != undefined && inclosed == undefined) {

            let prevg = inopen.g
            
            let newg = block.g + cost[k];
            
            if (newg<prevg){
              
              inopen.g = newg;
              inopen.px = block.x;
              inopen.py = block.y;
              
            }
            
          }
          
          
        } else if (nx == end[0] && ny == end[1]) {
          endblock = [block.x, block.y];
        }
      }
    }
  }

  return endblock;
}

function auto_explore() {
  let block = step();

  if (block == undefined) {
    setTimeout(auto_explore, delayy);
  } else {
    traceback(block[0], block[1]);
  }
}

function draw() {
  drawgrid();
}

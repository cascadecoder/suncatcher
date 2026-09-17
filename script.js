// setup canvas to be drawn
let c = document.getElementById("c");
c.width = window.innerWidth;
c.height = window.innerHeight;
let ctx = c.getContext('2d');

// grayscale cityscape randomly generated

let SCRIBBLE_DIST = 3; // 5px in either direction from line
let SCRIBBLE_AMT = 4; // one scribble per x px
let SCRIBBLE_ATTACH = 0.5; // how far it's allowed to go from previous
let SCRIBBLE_TICK = -1;
let SCRIBBLE_CHANGE = 7; // every 10 ticks
let GLOBAL_GRAY = 0;

let GROUND_LEVEL = c.height * 2 / 3

function distTo(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function gray(level) {
    level += GLOBAL_GRAY
    return "rgb(" + level + "," + level + "," + level + ")"
}

class Scribble {
    constructor(x1, y1, x2, y2, c, s) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.c = c;
        this.angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1)
        this.len = distTo(x1, y1, x2, y2)
        this.width = s;

        this.redraw = true;
        this.saved = [];
    }
    draw() {
        if (SCRIBBLE_TICK == 0) {
            this.redraw = true;
        }
        let x = this.x1;
        let y = this.y1;
        ctx.strokeStyle = this.c;
        ctx.lineWidth = this.width;
        ctx.beginPath()
        ctx.moveTo(x, y)
        if (!this.redraw) { // use saved line
            for (let i = 0; i < this.saved.length; i++) {
                ctx.lineTo(this.saved[i][0], this.saved[i][1])
            }
            ctx.lineTo(this.x2, this.y2);
            ctx.stroke()
            ctx.closePath()
            return;
        } else { // redraw the line
            this.saved = [];
        }
        let i = 0;
        let dist = 0;
        for (i = 0; i < this.len - SCRIBBLE_AMT; i += SCRIBBLE_AMT) {
            // point on the actual line
            let gx = this.x1 + Math.cos(this.angle) * i;
            let gy = this.y1 + Math.sin(this.angle) * i;
            // get point perpendicular to line
            let prev = dist
            dist = (Math.random()) * SCRIBBLE_DIST;
            if (Math.random() > 0.5) dist *= -1;
            if (Math.abs(dist - prev) > SCRIBBLE_ATTACH) {
                if (dist > prev) {
                    dist = prev + SCRIBBLE_ATTACH
                } else {
                    dist = prev - SCRIBBLE_ATTACH
                }
            }
            let a = this.angle + Math.PI / 2; // add 90 degs
            x = gx + Math.cos(a) * dist;
            y = gy + Math.sin(a) * dist;
            ctx.lineTo(x, y);
            this.saved.push([x, y])
        }
        if (i < this.len) {
            // draw rest of line
            ctx.lineTo(this.x2, this.y2);
        }
        ctx.stroke()
        ctx.closePath()


        this.redraw = false;
    }
}

class Rect {
    constructor(x, y, w, h, c, s) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.c = c;
        this.s = s;
        this.scribs = []
        this.makeScribbles()
    }
    makeScribbles() {
        this.scribs.push(new Scribble(this.x, this.y, this.x, this.y + this.h, this.c, this.s))
        this.scribs.push(new Scribble(this.x, this.y, this.x + this.w, this.y, this.c, this.s))
        this.scribs.push(new Scribble(this.x + this.w, this.y, this.x + this.w, this.y + this.h, this.c, this.s))
        this.scribs.push(new Scribble(this.x, this.y + this.h, this.x + this.w, this.y + this.h, this.c, this.s))
    }
    draw() {
        for (let i = 0; i < this.scribs.length; i++) {
            this.scribs[i].draw()
        }
    }
}
let buildingLayers = []
let buildingLayerAmt = 4;
let buildingTypes = []
let buildingRarity = 0
let buildingPadding = 30 // space btw buildings
class BuildingType {
    constructor(name, rarity, widthrange, heightrange) {
        this.name = name;
        this.rarity = rarity;
        this.widthrange = widthrange;
        this.heightrange = heightrange;
        buildingRarity += rarity;
        buildingTypes.push(this)
    }
}
// Create building types
new BuildingType("skyscaper", 100, [50, 150], [450, c.height - GROUND_LEVEL - buildingPadding])
new BuildingType("office", 80, [120, 200], [200, 350])
new BuildingType("garage", 50, [225, 350], [50, 150])

function initLayers() {
    for (let i = 0; i < buildingLayerAmt+1; i++) {
        let a = []
        buildingLayers.push(a)
    }
}
initLayers()

class Building {
    constructor(type, layer) {
        let buildings = buildingLayers[layer]
        this.x = 0
        this.y = 0
        this.w = Math.random() * (type.widthrange[1] - type.widthrange[0]) + type.widthrange[0]
        this.h = Math.random() * (type.heightrange[1] - type.heightrange[0]) + type.heightrange[0]
        this.windows = []
        this.layer = layer;
        this.y = GROUND_LEVEL - this.h;
        if (buildings.length == 0) {
            this.x = Math.random() * (c.width - this.w - buildingPadding * 2) + buildingPadding;

        } else {
            let available = []
            for (let i = 0; i < buildings.length; i++) {
                let xstart;
                if (i == 0) {
                    xstart = buildingPadding;
                } else {
                    xstart = buildings[i - 1].x + buildings[i - 1].w + buildingPadding;
                }
                let xend = buildings[i].x - buildingPadding;
                console.log("Space: " + Math.round(xstart) + " to " + Math.round(xend) + " | " + "Width: " + Math.round(this.w))
                if (this.w <= (xend - xstart)) {
                    // yeah we good
                    let diff = (xend - xstart) - this.w
                    available.push(xstart + Math.random() * diff) // random spot within range
                    console.log("Fit perfectly!")
                } else {
                    if (type.widthrange[0] < (xend - xstart)) {
                        // change size to fit
                        this.w = Math.random() * ((xend - xstart) - type.widthrange[0]) + type.widthrange[0]
                        let diff = (xend - xstart) - this.w
                        available.push(xstart + Math.random() * diff) // random spot within range
                        console.log("Fit with new width: " + this.w)
                    } else {
                        // find somewhere else
                        console.log("Didn't fit")
                        continue;
                    }
                }
            }
            // after last building, space btw far wall
            let xstart = buildings[buildings.length - 1].x + buildings[buildings.length - 1].w + buildingPadding
            let xend = c.width - buildingPadding
            if (this.w <= (xend - xstart)) {
                // yeah we good
                let diff = (xend - xstart) - this.w
                available.push(xstart + Math.random() * diff) // random spot within range
            } else {
                if (type.widthrange[0] < (xend - xstart)) {
                    // change size to fit
                    this.w = Math.random() * ((xend - xstart) - type.widthrange[0]) + type.widthrange[0]
                    let diff = (xend - xstart) - this.w
                    available.push(xstart + Math.random() * diff) // random spot within range
                } else {
                    //cooked
                }
            }

            if (available.length == 0) {
                // yeah no spots left sorry
                return
            }
            this.x = available[Math.floor(Math.random() * available.length)]
        }
        this.rect = new Rect(this.x, this.y, this.w, this.h, gray(200), 1.5)

        // sort building into the bulidings
        let position = false
        for (let i = 0; i < buildings.length; i++) {
            if (this.x > buildings[i].x) {
                continue;
            } else {
                buildings.splice(i,0,this)
                position = true
                break;
            }
        }
        if (!position) {
            buildings.push(this)
        }

        buildingLayers[layer] = buildings;
    }
    draw() {
        GLOBAL_GRAY = - this.layer * 5
        ctx.fillStyle = gray(50)
        ctx.fillRect(this.x,this.y,this.w,this.h)
        this.rect.draw()

        GLOBAL_GRAY = 0
    }
}

function build(layer) {
    let rand = Math.random() * buildingRarity;
    let type = -1;
    for (let i = 0; i < buildingTypes.length; i++) {
        rand -= buildingTypes[i].rarity;
        if (rand <= 0) {
            type = i;
            break;
        }
    }
    console.log(layer + " : " + buildingLayers)
    new Building(buildingTypes[type], layer)
}

function buildDraw() {
    for (let i = buildingLayers.length-1; i >=0; i--) {
        for (let j = 0; j < buildingLayers[i].length; j++) {
            buildingLayers[i][j].draw()
        }
        
    }
}

let ground = new Scribble(0, GROUND_LEVEL, c.width, GROUND_LEVEL, gray(100), 4)

for (let i = 0; i < 30; i++) {
    build(Math.floor(Math.random() * buildingLayerAmt))
}


var fps = Math.round(1000 / 30)

// run loop
var loop = setInterval(tick, fps);
function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = gray(28)
    ctx.fillRect(0, 0, c.width, c.height)

    SCRIBBLE_TICK += 1
    if (SCRIBBLE_TICK >= SCRIBBLE_CHANGE) {
        SCRIBBLE_TICK = 0;
    }

    buildDraw()
    ground.draw()
}

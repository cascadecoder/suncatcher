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
new BuildingType("skyscraper", 100, [40, 120], [450, c.height - GROUND_LEVEL - buildingPadding])
new BuildingType("office", 80, [120, 200], [160, 250])
new BuildingType("garage", 50, [225, 350], [50, 150])

function initLayers() {
    for (let i = 0; i < buildingLayerAmt+1; i++) {
        let a = []
        buildingLayers.push(a)
    }
}
initLayers()

class Window extends Rect {
    constructor(x,y,w,h,c,s) {
        super(x,y,w,h,c,s)

        this.on = false
        this.gradient = 0
    }

    switch() {
        this.on = !this.on;
    }

    wdraw() {
        if (this.on) {
            this.gradient += 0.1;
            if (this.gradient >= 1) {
                this.gradient = 1;
            }
            //ctx.globalAlpha = this.gradient;
            ctx.fillStyle = gray(140)
            ctx.fillRect(this.x,this.y,this.w,this.h)
        } else {
            this.gradient -= 0.1;
            if (this.gradient <= 0) {
                this.gradient = 0;
            }
            //ctx.globalAlpha = this.gradient;
        }

        ctx.globalAlpha = 1;
        this.draw()
    }
}

class Building {
    constructor(type, layer) {
        let buildings = buildingLayers[layer]
        this.x = 0
        this.y = 0
        this.w = Math.round(Math.random() * (type.widthrange[1] - type.widthrange[0]) + type.widthrange[0])
        this.h = Math.round(Math.random() * (type.heightrange[1] - type.heightrange[0]) + type.heightrange[0])
        this.windows = []
        this.layer = layer;
        this.y = GROUND_LEVEL - this.h;
        if (buildings.length == 0) {
            this.x = Math.round(Math.random() * (c.width - this.w - buildingPadding * 2) + buildingPadding);

        } else {
            // get ready for the worst code every written
            let available = []
            for (let i = 0; i < buildings.length; i++) {
                let xstart;
                if (i == 0) {
                    xstart = buildingPadding;
                } else {
                    xstart = buildings[i - 1].x + buildings[i - 1].w + buildingPadding;
                }
                let xend = buildings[i].x - buildingPadding;
                if (this.w <= (xend - xstart)) {
                    // yeah we good
                    let diff = (xend - xstart) - this.w
                    available.push(xstart + Math.random() * diff) // random spot within range
                } else {
                    if (type.widthrange[0] < (xend - xstart)) {
                        // change size to fit
                        this.w = Math.round(Math.random() * ((xend - xstart) - type.widthrange[0]) + type.widthrange[0])
                        let diff = (xend - xstart) - this.w
                        available.push(xstart + Math.round(Math.random() * diff)) // random spot within range
                    } else {
                        // find somewhere else
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
                available.push(xstart + Math.round(Math.random() * diff)) // random spot within range
            } else {
                if (type.widthrange[0] < (xend - xstart)) {
                    // change size to fit
                    this.w = Math.round(Math.random() * ((xend - xstart) - type.widthrange[0]) + type.widthrange[0])
                    let diff = (xend - xstart) - this.w
                    available.push(xstart + Math.round(Math.random() * diff)) // random spot within range
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

        this.createWindows()
    }
    createWindows() {
        let window = {
            height: 0.6*Math.round((8*Math.random()+10)),
            width: 0.7*Math.round(5*Math.random()+8),
            padding: 0.5*(10 + Math.round(7*Math.random()))
        }

        let hamt = Math.floor((this.w-window.padding/2) / (window.width+window.padding))
        let vamt = Math.floor((this.h-window.padding/2) / (window.height+window.padding))
        let hspan = hamt * (window.width+window.padding)-window.padding
        let vspan = vamt * (window.height+window.padding)-window.padding
        hspan = this.w - hspan
        vspan = this.h - vspan
        for (let x = 0; x < hamt; x++) {
            let cx = this.x +hspan / 2
            let cy = this.y + vspan/2
            for (let y = 0; y < vamt; y++) {
                let w = new Window(cx+x*(window.width+window.padding), cy+y*(window.height+window.padding), window.width,window.height,gray(120),1)
                if (Math.random() < 1/10) {
                    w.on = true;
                }
                this.windows.push(w)
            }
        }
        this.hspan = hspan
        this.hamt = hamt;

        //alert(this.windows)
    }
    draw() {
        GLOBAL_GRAY = - this.layer * 5
        ctx.fillStyle = gray(50)
        ctx.fillRect(this.x,this.y,this.w,this.h)
        this.rect.draw()
        for (let i = 0; i < this.windows.length; i++) {
            if (SCRIBBLE_TICK == 0 && Math.random() < 1/400) {
                this.windows[i].switch()
            }
            this.windows[i].wdraw()
        }

        /*ctx.fillStyle = gray(200);
        ctx.fillText(this.hspan + " " + this.w + " " + this.hamt,this.x,this.y)
        ctx.fillRect(this.x,this.y,this.hspan,4)
        ctx.fillRect(this.x,this.y+4,this.w,4)*/

        GLOBAL_GRAY = 0
    }
}
let clouds = []
class Cloud { // multiple rectangles stacked on/under each other
    constructor(x,y,w,h,col,s, v) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h; // max height of cloud
        this.lines = []
        this.rects = []
        this.c = col;
        this.s = s;
        this.v = v;
        if (Math.random() > 0.5) {
            this.v *= -1;
            this.x = c.width - this.x
        }
        if (this.y - this.h < 10) {
            this.y = this.h+10
        }

        this.create()

        clouds.push(this)
    }

    create() {
        let dir = "up"
        let minstep = {
            x: 10,
            y: 5
        }
        let maxstep = {
            x: 40,
            y: 10
        }
        let x = this.x;
        let y = this.y - maxstep.y * Math.random() * 2;
        this.line(this.x,this.y,x,y)
        for (let i = 0; i < 100; i++) {
            let prevx = x;
            let prevy = y;
            let step;
            if (dir == "up") {
                step = Math.random() * (maxstep.y-minstep.y) + minstep.y
                if (y-step < this.y-this.h) { // goes over limit
                    if (this.h-(y-this.y) < minstep.y) { // too small of gap
                        y += step;
                    } else {
                        y = this.y-this.h;
                    }
                } else {
                    y -= step

                }
                dir = "right"
            } else if (dir == "down") {
                step = Math.random() * (maxstep.y-minstep.y) + minstep.y
                if (y+step > this.y - minstep.y) {
                    if (Math.abs(y-this.y) < minstep.y*2) {
                        y -= step;
                    } else {
                        y=this.y-minstep.y
                    }
                } else {
                    y += step;
                }
                dir = "right"
            } else {
                step = Math.random() * (maxstep.x-minstep.x) + minstep.x
                if (x+step > this.x+this.w) {
                    x = this.x + this.w;
                } else {
                    x += step;
                }

                if (Math.random() > (x-this.x)/this.w) {
                    dir = "up";
                } else {
                    dir = "down";
                }
            }
            if (x >= this.x + this.w-minstep.x) { // just change w instead of cutting close
                this.w = x-this.x;
                this.line(prevx,prevy,x,y)
                break;
            }
            this.line(prevx,prevy,x,y)
        }
        this.line(x,y,this.x+this.w,this.y)

        this.line(this.x,this.y,this.x+this.w,this.y)
    }

    draw() {
        let prevx, prevy
        let move = (SCRIBBLE_TICK == 0)
        for (let i = 0; i < this.lines.length; i++) {
            if (move) {
                this.lines[i].x1 += this.v;
                this.lines[i].x2 += this.v;
            }
            if (this.lines[i].y2 == this.lines[i].y1) { // fill in cloud
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = gray(this.c-50);
                ctx.fillRect(prevx,prevy,this.lines[i].x2-prevx,this.y-prevy)
                ctx.globalAlpha = 1
            }
            prevx = this.lines[i].x2;
            prevy = this.lines[i].y2

            this.lines[i].draw()
            
        }
    }

    line(x1,y1,x2,y2) {
        this.lines.push(new Scribble(x1,y1,x2,y2,gray(this.c),this.s))
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
    new Building(buildingTypes[type], layer)
}

function buildDraw() {
    for (let i = buildingLayers.length-1; i >=0; i--) {
        for (let j = 0; j < buildingLayers[i].length; j++) {
            buildingLayers[i][j].draw()
        }
        
    }
}

function newCloud(x) {
    new Cloud (x,Math.random()*GROUND_LEVEL*0.75,Math.random()*150+50,Math.random()*30+30,(200),1.5,Math.random()*2+0.5)
}

function cloudDraw() {
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].draw()
    }
}

let ground = new Scribble(0, GROUND_LEVEL, c.width, GROUND_LEVEL, gray(100), 4)

for (let i = 0; i < 30; i++) {
    build(Math.floor(Math.random() * buildingLayerAmt))
}

for (let i = 0; i < Math.random()*2+3; i++) {
    newCloud(Math.random()*c.width)
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

        // randomly create cloud
        if (Math.random() < 1/20) {
            newCloud(-100*Math.random()-200)
        }
    }
    cloudDraw()
    buildDraw()
    ground.draw()
}

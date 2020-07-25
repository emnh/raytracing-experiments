const $ = require('jquery');

const PIXI = require('pixi.js');

document.body.style = "margin: 0px; padding: 0px;";

const app = new PIXI.Application({ antialias: true, width: 800, height: 800 });
document.body.appendChild(app.view);

const width = app.view.width;
const height = app.view.height;

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = width;
canvas.height = height;
canvas.style = "position: absolute; left: 0; ";
const ctx = canvas.getContext('2d');
var myImageData = ctx.createImageData(width, height);

$("body").append("<h1>" + (new Date()).toTimeString() + "</h1>");

const colors = 4;

const data = myImageData.data;

function interceptCircleLineSeg(circle, line){
    var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if(isNaN(d)){ // no intercept
        return [];
    }
    u1 = (b - d) / c;  
    // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;    
    retP1 = {};   // return points
    retP2 = {}  
    ret = []; // return array
    if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }       
    return ret;
}


const f = function(data, x, y, rgba) {
  data[(y * height + x) * colors + 0] = rgba.r * 255;
  data[(y * height + x) * colors + 1] = rgba.g * 255;
  data[(y * height + x) * colors + 2] = rgba.b * 255;
  data[(y * height + x) * colors + 3] = rgba.a * 255;
};

const graphics = new PIXI.Graphics();

const light = {
  x: 50,
  y: 50,
  r: 25,
  color: 0xFFFFFF,
  type: "light"
};

const circle = {
  x: 200,
  y: 400,
  r: 150,
  color: 0xDE3249,
  type: "solid"
};

const dl = function(a, b) {
  graphics.lineStyle(1, 0xFFFFFF, 1);
  graphics.moveTo(a.x, a.y);
  graphics.lineTo(b.x, b.y);
};

const drawTangent = function(circle) {
  const dx = circle.x - light.x;
  const dy = circle.y - light.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const ac = Math.acos(circle.r / dist);
  const angle = Math.atan2(light.y - circle.y, light.x - circle.x);
  const angle1 = angle + ac;
  const angle2 = angle - ac;

  const tangentPoint1 = {
    x: circle.x + circle.r * Math.cos(angle1),
    y: circle.y + circle.r * Math.sin(angle1)
  };

  dl(light, tangentPoint1);

  const tangentPoint2 = {
    x: circle.x + circle.r * Math.cos(angle2),
    y: circle.y + circle.r * Math.sin(angle2)
  };

  dl(light, tangentPoint2);
}

const drawCircle = function(circle) {
  graphics.beginFill(circle.color);
  graphics.drawCircle(circle.x, circle.y, circle.r);
  graphics.endFill();
  drawTangent(circle);
};

const euclid = function(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const objects = [
  { x: 400, y: 100, r: 50, color: 0x0000FF, type: "solid" },
  circle,
  light
];

for (obj of objects) {
  drawCircle(obj);
}

app.stage.addChild(graphics);

const rgbaTest = {
  r: (x, y) => Math.sin(2.0 * Math.PI * x / width) * 0.5 + 0.5,
  g: (x, y) => 0.0,
  b: (x, y) => Math.sin(2.0 * Math.PI * y / height) * 0.5 + 0.5,
  a: (x, y) => 0.5
};

const maxDist = euclid({x: 0, y: 0}, {x: width, y: height});

const sampleCount = 10;

const ray = function(x, y, sampleCount, depth) {

  const ret = {
    r: 0.0,
    g: 0.0,
    b: 0.0,
    a: 0.0
  };

  if (depth > 4) {
    return 0.0;
  }

  let lc = 0.0;

  for (let i = -1; i < sampleCount; i++) {
    const angle = 
      i == -1 ?
        Math.atan2(light.y - y, light.x - x) :
        (i + Math.random()) / sampleCount * 2.0 * Math.PI;
        //(2.0 * Math.PI * (sampleCount * i + Math.random()));
    let hit = false;
    let hitObj = false;

    const orig = {x: x, y: y};
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    const endpoint = { x: orig.x + maxDist * dir.x, y: orig.y + maxDist * dir.y };
    const line = {
      p1: orig,
      p2: endpoint
    };

    let mind = maxDist;
    let loopdist = 0.0;

    for (obj of objects) {      
      const circleObj = {
        radius: obj.r,
        center: obj
      };

      const result = interceptCircleLineSeg(circleObj, line);

      if (result.length > 0) {
        newhit = result[Math.floor(Math.random() * result.length)];
        const d = euclid(newhit, orig);
        if (d < mind) {
          hit = newhit;
          hitObj = obj;
          mind = d;
        }
      } else {

      }
    }
    const directMul = i == -1 ? 0.5 : 1.0;

    const lc = 1.0 / sampleCount;
    const f = 1.0; // / sampleCount;
    if (hit === false) {
      //const edgePoint = { x: 0.0, y: 0.0 };
      const dx = 
        dir.x < 0.0 ?
          x / -dir.x :
          (width - x) / dir.x;
      const dy = 
        dir.y < 0.0 ?
          y / -dir.y :
          (height - y) / dir.y;
      const dt = Math.min(dx, dy);
      const edgePoint = { x: orig.x + dt * dir.x, y: orig.y + dt * dir.y };
      const result = ray(edgePoint.x, edgePoint.y, 0, depth + 1);

      ret.r += result.r;
      ret.g += result.g;
      ret.b += result.b;
      ret.a = result.a * dt / maxDist;
      //ret.a += lc * result.a * f;

      if (dt == dx) {
        if (dir.x < 0.0) {
          ret.r = 0.5;
        } else {
          ret.r = 0.25;
        }
      } else if (dt == dy) {
        if (dir.y < 0.0) {
          ret.b = 0.5;
        } else {
          ret.b = 0.25;
        }
      }

      //loopdist += (result.dist + dt / maxDist) / sampleCount;
      //ret.dist = result.dist + dt / maxDist;
    } else {
      const hitDist = euclid(hit, { x: x, y: y }) / maxDist;
      if (hitObj.type == "light") {
        ret.r += (hitObj.color >>> 16) & 0xFF;
        ret.g += (hitObj.color >>> 8) & 0xFF;
        ret.b += (hitObj.color) & 0xFF;
        //ret.a += 1.0 / sampleCount;
        //ret.dist = hitDist;
        //loopdist += hitDist;
        ret.a += hitDist * lc;
      } else if (hitObj.type == "solid") {
        const result =
          ray(
            Math.round(hit.x + (2.0 * Math.random - 1.0)),
            Math.round(hit.y + (2.0 * Math.random - 1.0), 0, depth + 1);
        ret.r += 1 * (result.r * f + (hitObj.color >>> 16) & 0xFF);
        ret.g += 1 * (result.g * f + (hitObj.color >>> 8) & 0xFF);
        ret.b += 1 * (result.b * f + (hitObj.color >>> 0) & 0xFF);
        //ret.a += lc * result.a * f;
        ret.a += result.a * hitDist * lc;
        //loopdist += result.dist + hitDist;
      } else {
        
      }
    }
  }
  const lc = 1.0;

  //ret.r *= lc;
  //ret.g *= lc;
  //ret.b *= lc;

  const clamp = function(x, a, b) {
    return Math.min(Math.max(x, a), b);
  };

  ret.r = clamp(ret.r * lc, 0.0, 1.0);
  ret.g = clamp(ret.g * lc, 0.0, 1.0);
  ret.b = clamp(ret.b * lc, 0.0, 1.0);
  ret.a = clamp(ret.a * lc, 0.0, 1.0);
  return ret;
};

const rgbaLight = {
  r: (x, y) => 1.0,
  g: (x, y) => 1.0,
  b: (x, y) => 1.0,
  a: (x, y) => ray(x, y, sampleCount, 0)
};

const rgba = rgbaLight;

for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {
    const ret = ray(x, y, sampleCount, 0);
    f(data, x, y, ret);
  }
}

ctx.putImageData(myImageData, 0, 0);

$("body").append("<h1>" + (new Date()).toTimeString() + "</h1>");
function downloadURL(url, name) {
    document.body.appendChild(Object.assign(document.createElement("A"), {
        download: name,
        href: url,
        clickRemove () {
            this.click();
            this.remove()
        }
    })).clickRemove();
}

/**
 * @type {HTMLCanvasElement}
 */
const canvas = $("#fractal") || document.body.appendChild(document.createElement("CANVAS"));
canvas.width = $("#sett-width").value = 512;
canvas.height = $("#sett-height").value = 512;
canvas.id = "fractal";

/**
 * @type {WebGLRenderingContext}
 */
const gl = canvas.getContext("webgl", {
    preserveDrawingBuffer: true
});

let iterations = $("#sett-iterations").value = 100;
let scale = $("#sett-scale").value = 1.5;
let nodes = $("#sett-nodes").value = 75;
let center = {
    x: 0.7,
    y: 0
};
$("#sett-centerx").value = center.x;
$("#sett-centery").value = center.y;

let backgroundCol = $("#sett-bgcol").value = "#ff0000"
let nodeCol = $("#sett-nodecol").value = "#ffff00"
let fractalCol = $("#sett-fraccol").value = "#000000"

// let resolution = [1, 1];

let vertices = [
    -1, 1, 0.0,
    -1, -1, 0.0,
    1, -1, 0.0,
    1, 1, 0.0
];

let indices = [3, 2, 1, 3, 1, 0];

let vertexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

let indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

const vertexShaderSource = `
attribute vec3 coordinates;
varying vec2 _coordinates; 

void main() {
    _coordinates = vec2(coordinates.x, coordinates.y);
    gl_Position = vec4(coordinates, 1.0);
}
`;

const fragShaderSource = `
precision highp float;

#define PI ${Math.PI}

varying vec2 _coordinates; 

// uniform vec2 resolution;
uniform vec2 center;
uniform float scale;
uniform float nodes;
uniform int maxIts;
uniform vec3 bgCol;
uniform vec3 nodeCol;
uniform vec3 fracCol;

vec2 f (vec2 z, vec2 c) {
    return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
}

void main() {
    vec2 c = _coordinates * scale - center,
        z; 
    for (int i = 0; i < 10000; i++) {
        if (i > maxIts) break; // a way to solve the Loop index cannot be compared with non-constant expression error
        z = f(z, c);
        float x = (float(i) - log(log(length(z))));
        gl_FragColor = vec4(mix(bgCol, nodeCol, x * (nodes / 1000.)), 1);
        if (length(z) > 2.0) return;
    }
    
    gl_FragColor = vec4(fracCol, 1);
}
`

/**
 * For creating WebGL Shaders
 * @param {string} sourceCode GLSL Shader Source
 * @param {35632|35633} type WebGL Shader Type
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader
 * @returns {WebGLShader}
 */
function createShader(sourceCode, type) {
    // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
    var shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var info = gl.getShaderInfoLog(shader);
        throw "Could not compile WebGL program. \n\n" + info;
    }
    return shader;
}

const shaderProgram = gl.createProgram();

const fragmentShader = createShader(fragShaderSource, gl.FRAGMENT_SHADER);
const vertexShader = createShader(vertexShaderSource, gl.VERTEX_SHADER);

gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);

gl.linkProgram(shaderProgram);

let progLog = gl.getProgramInfoLog(shaderProgram);
if (!!progLog) console.log(progLog)

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
let coord = gl.getAttribLocation(shaderProgram, "coordinates");

function animate() {

    $("#res-width").innerHTML = canvas.width;
    $("#res-height").innerHTML = canvas.height;

    let iterLocation = gl.getUniformLocation(shaderProgram, "maxIts")
    let scaleLocation = gl.getUniformLocation(shaderProgram, "scale")
    let centerLocation = gl.getUniformLocation(shaderProgram, "center")
    let nodesLocation = gl.getUniformLocation(shaderProgram, "nodes")
    let bgLocation = gl.getUniformLocation(shaderProgram, "bgCol")
    let nodeColLocation = gl.getUniformLocation(shaderProgram, "nodeCol")
    let fracColLocation = gl.getUniformLocation(shaderProgram, "fracCol")

    // let resLocation = gl.getUniformLocation(shaderProgram, "resolution")

    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    gl.useProgram(shaderProgram);

    gl.uniform1i(iterLocation, iterations)
    gl.uniform1f(scaleLocation, scale)
    gl.uniform1f(nodesLocation, nodes)
    gl.uniform2fv(centerLocation, [center.x, center.y])
    gl.uniform3fv(bgLocation, glColor(hexToRGB(backgroundCol)))
    gl.uniform3fv(nodeColLocation, glColor(hexToRGB(nodeCol)))
    gl.uniform3fv(fracColLocation, glColor(hexToRGB(fractalCol)))
    // gl.uniform2fv(resLocation, resolution)

    let height = canvas.height / (canvas.width > canvas.height ? (canvas.height / canvas.width) : 1);
    let width = canvas.width * (canvas.width < canvas.height ? (canvas.height / canvas.width) : 1);

    gl.viewport(0, 0, width, height) //, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

function animateLoop () {
    animate();
    window.requestAnimationFrame(animateLoop);
}

animateLoop()

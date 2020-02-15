/**
 * @file CS 418 Iteractive Computer Graphics MP1
 * @description A 2-D animation of the University of Illinois logo and a bouncing ball.
 * @author Navi Ning <xning5@illinois.edu>
 */

/** @global Current animation: Animation1 (default) | Animation2 */
var animation = "animation1";

/** @global The HTML5 canvas */
var canvas;

/** @global The WebGL context */
var gl;

/** @global Vertex positions */
var vertexPositions;

/** @global Vertex colors */
var vertexColors;

/** @global The Modelview Matrix */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix */
var pMatrix = glMatrix.mat4.create();

/** @global The GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The id of current animation provided by requestAnimationFrame */
var animationId;

/** @global Current frame of the animation */
var frame = 0;

// --------------------------- Animation 2 ------------------------------

/** @global Number of vertices around the circle boundary (Animation 2) */
var numVertices;

/** @global A flag determine whether the ball hits the wall 
 *  No: 0 | x-direction: 1 | y-direction: 2*/
var wallFlag = 0;

/** @global Current frame when the ball hits the wall */
var wallFrame = 0;

/** @global Initial direction of the ball */
var xDirection = -1 + 2 * Math.random();
var yDirection = -1 + 2 * Math.random();

// -------------------------------------------------------------------------

/**
 * Create WebGL Context.
 * @param {element} canvas HTML5 canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch (e) { }
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Load Shaders from DOM and compile them.
 * @param {string} id The ID of the shader source.
 */
function loadShader(id) {
  var shaderScript = document.getElementById(id);

  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    console.log(id + ": Script not found!");
    return null;
  }

  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

/**
 * Get attribute and uniform locations, store them in the shader program.
 */
function getLocations() {
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Setup fragment and vertex shaders.
 */
function setupShaders() {
  var vertexShader = loadShader("shader-vs");
  var fragmentShader = loadShader("shader-fs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  getLocations();
}

/**
 * Load vertex positions buffer with data
 * @param type initial: initialize vertex positions | update: update vertex positions
 */
function loadVertices(type) {
  if (type == "initial") {
    vertexPositionBuffer = gl.createBuffer();
    getVertexPositions();
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.DYNAMIC_DRAW);
}

/**
 * Load vertex colors buffer with data
 * @param type initial: initialize vertex positions | update: update vertex positions
 */
function loadColors(type) {
  if (type == "initial") {
    vertexColorBuffer = gl.createBuffer();
    getVertexColors();
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);



  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);


}

/**
 * Setup buffers for verticles and colors.
* @param type initial: initialize vertex positions | update: update vertex positions
 */
function setupBuffers(type = "update") {
  // Generate vertex positions
  loadVertices(type);
  // Generate vertex colors
  loadColors(type);
}

/**
 * Draw the content onto the canvas.
 */
function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  if (animation == "animation1")
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems)
  if (animation == "animation2")
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Animation to be called from tick. Update buffers every tick.
 */
function animate() {
  if (animation == "animation1") {
    getVertexPositions();
    if (frame == 0) {
      glMatrix.mat4.identity(mvMatrix);
      glMatrix.mat4.scale(mvMatrix, mvMatrix, [0.5, 0.5, 0.5]);
      glMatrix.mat4.translate(mvMatrix, mvMatrix, [0, -3, 0]);
    }

    if (frame <= 50) {
      var degree = 2 * 360 / 180 * Math.PI;
      glMatrix.mat4.rotate(mvMatrix, mvMatrix, degree / 50, [0, 1, 0]);
      glMatrix.mat4.translate(mvMatrix, mvMatrix, [0, 0.06, 0]);
    }

    if (60 < frame && frame <= 110) {
      var scale = Math.pow(2, 1 / 50);
      glMatrix.mat4.scale(mvMatrix, mvMatrix, [scale, scale, scale]);
    }

    if (120 < frame && frame <= 200) {
      glMatrix.mat4.scale(mvMatrix, mvMatrix, [1.03, 1, 1]);
      var translate = - 0.05 * Math.pow(1.03, 1 / (frame - 120));
      glMatrix.mat4.translate(mvMatrix, mvMatrix, [translate, 0, 0]);
      if (frame == 160) {
        glMatrix.mat4.translate(mvMatrix, mvMatrix, [6.02, 0, 0]);
      }
    }

    if (200 < frame && frame <= 220) {
      glMatrix.mat4.scale(mvMatrix, mvMatrix, [0.888, 1, 1]);
      glMatrix.mat4.translate(mvMatrix, mvMatrix, [-0.04, 0, 0]);
    }

    // animation part
    if (230 < frame && frame <= 260) {
      for (var i = 0; i < vertexPositions.length; i += 3) {
        var radius = (vertexPositions[i] ** 2 + (vertexPositions[i + 1] + 0.3) ** 2) ** 0.5;
        var degree = (frame - 230) * Math.PI / 240;
        if (vertexPositions[i + 1] > 0) {
          vertexPositions[i] -= Math.sin(degree) * radius;
          vertexPositions[i + 1] -= (1 - Math.cos(degree)) * radius;

        }
      }
    }

    if (260 < frame && frame <= 290) {
      for (var i = 0; i < vertexPositions.length; i += 3) {
        var radius = (vertexPositions[i] ** 2 + (vertexPositions[i + 1] + 0.3) ** 2) ** 0.5;
        var degree = (290 - frame) * Math.PI / 240;
        if (vertexPositions[i + 1] > 0) {
          vertexPositions[i + 1] -= (1 - Math.cos(degree)) * radius;
          vertexPositions[i] -= Math.sin(degree) * radius;
        }
      }
    }

    if (290 < frame && frame <= 320) {
      for (var i = 0; i < vertexPositions.length; i += 3) {
        var radius = (vertexPositions[i] ** 2 + (vertexPositions[i + 1] + 0.3) ** 2) ** 0.5;
        var degree = (frame - 290) * Math.PI / 240;
        if (vertexPositions[i + 1] > 0) {
          vertexPositions[i + 1] -= (1 - Math.cos(degree)) * radius;
          vertexPositions[i] += Math.sin(degree) * radius;
        }
      }
    }

    if (320 < frame && frame <= 350) {
      for (var i = 0; i < vertexPositions.length; i += 3) {
        var radius = (vertexPositions[i] ** 2 + (vertexPositions[i + 1] + 0.3) ** 2) ** 0.5;
        var degree = (350 - frame) * Math.PI / 240;
        if (vertexPositions[i + 1] > 0) {
          vertexPositions[i + 1] -= (1 - Math.cos(degree)) * radius;
          vertexPositions[i] += Math.sin(degree) * radius;
        }
      }
    }

    if (360 < frame && frame <= 440) {
      for (var i = 0; i < vertexPositions.length; i += 3) {
        if (vertexPositions[i + 1] > 0) {
          var radius = 0.15;
          var degree = (frame - 360) * 4 * Math.PI / 80;
          vertexPositions[i + 1] -= (1 - Math.cos(degree)) * radius;
          vertexPositions[i] -= Math.sin(degree) * radius;
        }
      }
    }

    if (450 < frame && frame <= 530) {
      for (var i = 0; i < vertexPositions.length; i += 3) {
        if (vertexPositions[i + 1] > 0) {
          var radius = 0.15;
          var degree = (frame - 450) * 4 * Math.PI / 80;
          vertexPositions[i + 1] -= (1 - Math.cos(degree)) * radius;
          vertexPositions[i] += Math.sin(degree) * radius;
        }
      }
    }

    if (540 < frame && frame <= 820) {
      glMatrix.mat4.rotate(mvMatrix, mvMatrix, (frame - 180) * 0.0015, [1, 1, 1]);

      glMatrix.mat4.scale(mvMatrix, mvMatrix, [1, 1, 0.96]);
    }
    if (frame >= 820) {
      frame = -1;
    }

  }

  if (animation == "animation2") {

    if (wallFlag == 1) {
      yDirection = -yDirection * (0.95 + 0.1 * Math.random());
      getVertexColors();
      wallFlag = 0;
      wallFrame = frame;
    }

    if (wallFlag == 2) {
      xDirection = -xDirection * (0.95 + 0.1 * Math.random());
      getVertexColors();
      wallFlag = 0;
      wallFrame = frame;
    }

    var speed = 0.02;
    var xSpeed = xDirection / (xDirection ** 2 + yDirection ** 2) ** 0.5 * speed;
    var ySpeed = yDirection / (xDirection ** 2 + yDirection ** 2) ** 0.5 * speed;

    // Detect if the ball hits the wall
    for (var i = 0; i < vertexPositions.length; i += 3) {
      var nextX = vertexPositions[i] + xSpeed;
      var nextY = vertexPositions[i + 1] + ySpeed;
      if (nextX >= 1.0 || nextX <= -1.0) {
        wallFlag = 2;
        break;
      }
      if (nextY >= 1.0 || nextY <= -1.0) {
        wallFlag = 1;
        break;
      }
    }

    // Move the ball
    if (wallFlag == 0) {
      for (var i = 0; i < vertexPositions.length; i += 3) {
        vertexPositions[i] += xSpeed;
        vertexPositions[i + 1] += ySpeed;
      }
    }

  }

  frame += 1;

  setupBuffers("update");
}

/**
 * Tick called for every animation frame.
 */
function tick() {
  animationId = requestAnimationFrame(tick);
  animate();
  draw();
}

/**
 * The main function which starts the program.
 */
function main() {
  canvas = document.getElementById("glCanvas");
  gl = createGLContext(canvas);

  gl.clearColor(0.0, 0.0, 0.0, 0.1);
  gl.enable(gl.DEPTH_TEST);

  setupShaders();
  setupBuffers("initial");

  tick();
}

/**
 * Switch the current animation, clear current buffer.
 * @param currAnimation Selected animation
 */
function switchAnimation(currAnimation) {
  if (animation != currAnimation) {
    animation = currAnimation;

    cancelAnimationFrame(animationId);
    frame = 0;
    glMatrix.mat4.identity(mvMatrix);
    glMatrix.mat4.identity(pMatrix);

    main();
  }
}


// -----------------------------------------------------------------------------

/**
 * Get vertex positions.
 */
function getVertexPositions() {
  if (animation == "animation1") {

    var contentVertices = [
      -0.36, 0.34, 0.0,
      -0.16, 0.34, 0.0,
      -0.36, 0.56, 0.0,
      -0.16, 0.34, 0.0,
      -0.36, 0.56, 0.0,
      -0.16, 0.56, 0.0,
      0.36, 0.34, 0.0,
      0.16, 0.34, 0.0,
      0.36, 0.56, 0.0,
      0.16, 0.34, 0.0,
      0.36, 0.56, 0.0,
      0.16, 0.56, 0.0,
      -0.16, 0.34, 0.0,
      -0.16, 0.56, 0.0,
      0.16, 0.34, 0.0,
      0.16, 0.34, 0.0,
      -0.16, 0.56, 0.0,
      0.16, 0.56, 0.0,
      -0.36, -0.34, 0.0,
      -0.16, -0.34, 0.0,
      -0.36, -0.56, 0.0,
      -0.16, -0.34, 0.0,
      -0.36, -0.56, 0.0,
      -0.16, -0.56, 0.0,
      0.36, -0.34, 0.0,
      0.16, -0.34, 0.0,
      0.36, -0.56, 0.0,
      0.16, -0.34, 0.0,
      0.36, -0.56, 0.0,
      0.16, -0.56, 0.0,
      -0.16, -0.34, 0.0,
      -0.16, -0.56, 0.0,
      0.16, -0.34, 0.0,
      0.16, -0.34, 0.0,
      -0.16, -0.56, 0.0,
      0.16, -0.56, 0.0,
      -0.16, -0.34, 0.0,
      -0.16, 0.34, 0.0,
      0.16, -0.34, 0.0,
      -0.16, 0.34, 0.0,
      0.16, -0.34, 0.0,
      0.16, 0.34, 0.0
    ];

    var edgeVertices = [
      -0.4, 0.6, 0.0,
      -0.4, 0.56, 0.0,
      0.4, 0.6, 0.0,
      -0.4, 0.56, 0.0,
      0.4, 0.6, 0.0,
      0.4, 0.56, 0.0,
      -0.4, 0.56, 0.0,
      -0.36, 0.56, 0.0,
      -0.4, 0.34, 0.0,
      -0.4, 0.34, 0.0,
      -0.36, 0.34, 0.0,
      -0.36, 0.56, 0.0,
      0.4, 0.56, 0.0,
      0.36, 0.56, 0.0,
      0.4, 0.34, 0.0,
      0.4, 0.34, 0.0,
      0.36, 0.34, 0.0,
      0.36, 0.56, 0.0,
      -0.4, 0.34, 0.0,
      -0.4, 0.3, 0.0,
      -0.16, 0.3, 0.0,
      -0.16, 0.3, 0.0,
      -0.16, 0.34, 0.0,
      -0.4, 0.34, 0.0,
      0.4, 0.34, 0.0,
      0.4, 0.3, 0.0,
      0.16, 0.3, 0.0,
      0.16, 0.3, 0.0,
      0.16, 0.34, 0.0,
      0.4, 0.34, 0.0,
      -0.2, 0.3, 0.0,
      -0.2, -0.34, 0.0,
      -0.16, -0.34, 0.0,
      -0.2, 0.3, 0.0,
      -0.16, -0.34, 0.0,
      -0.16, 0.34, 0.0,
      0.2, 0.3, 0.0,
      0.2, -0.34, 0.0,
      0.16, -0.34, 0.0,
      0.2, 0.3, 0.0,
      0.16, -0.34, 0.0,
      0.16, 0.34, 0.0,
      -0.4, -0.6, 0.0,
      -0.4, -0.56, 0.0,
      0.4, -0.6, 0.0,
      -0.4, -0.56, 0.0,
      0.4, -0.6, 0.0,
      0.4, -0.56, 0.0,
      -0.4, -0.56, 0.0,
      -0.36, -0.56, 0.0,
      -0.4, -0.34, 0.0,
      -0.4, -0.34, 0.0,
      -0.36, -0.34, 0.0,
      -0.36, -0.56, 0.0,
      0.4, -0.56, 0.0,
      0.36, -0.56, 0.0,
      0.4, -0.34, 0.0,
      0.4, -0.34, 0.0,
      0.36, -0.34, 0.0,
      0.36, -0.56, 0.0,
      -0.4, -0.34, 0.0,
      -0.4, -0.3, 0.0,
      -0.16, -0.3, 0.0,
      -0.16, -0.3, 0.0,
      -0.16, -0.34, 0.0,
      -0.4, -0.34, 0.0,
      0.4, -0.34, 0.0,
      0.4, -0.3, 0.0,
      0.16, -0.3, 0.0,
      0.16, -0.3, 0.0,
      0.16, -0.34, 0.0,
      0.4, -0.34, 0.0,
    ];

    vertexPositions = contentVertices.concat(edgeVertices);

    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = vertexPositions.length / vertexPositionBuffer.itemSize;
  }

  if (animation == "animation2") {
    vertexPositions = [0.08, 0.08, 0.0];
    var radius = 0.25
    var z = 0.0;
    numVertices = 100;

    for (i = 0; i <= numVertices; i++) {
      angle = i * 2 * Math.PI / numVertices;
      x = (radius * Math.cos(angle));
      y = (radius * Math.sin(angle));
      vertexPositions.push(x);
      vertexPositions.push(y);
      vertexPositions.push(z);
    }

    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = numVertices + 2;

  }

}

/**
 * Get vertex colors.
 */
function getVertexColors() {
  if (animation == "animation1") {
    vertexColors = [];
    for (i = 0; i < 42; i++) {
      vertexColors.push(0.909, 0.290, 0.152, 1.0);
    }
    for (i = 0; i < 72; i++) {
      vertexColors.push(0.074, 0.160, 0.294, 1.0);
    }
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numberOfItems = vertexColors.length / vertexColorBuffer.itemSize;
  }

  if (animation == "animation2") {
    vertexColors = [1.0, 1.0, 1.0, 1.0];
    var a = 1.0;
    var g = Math.random();
    var halfV = numVertices / 2.0;
    for (i = 0; i <= numVertices; i++) {
      r = Math.abs((i - halfV) / halfV);
      b = 1.0 - r;
      vertexColors.push(r);
      vertexColors.push(g);
      vertexColors.push(b);
      vertexColors.push(a);
    }
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numberOfItems = numVertices + 2;
  }

  return vertexColors;
}
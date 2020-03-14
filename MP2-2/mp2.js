/**
 * @file CS 418 Iteractive Computer Graphics MP2
 * @description A WebGL example of flight simulator
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 * @author Navi Ning <xning5@illinois.edu>
 */


/** @global The HTML5 canvas */
var canvas;

/** @global The WebGL context */
var gl;

/** @global The Modelview Matrix */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix */
var pMatrix = glMatrix.mat4.create();

/** @global The Normal matrix */
var nMatrix = glMatrix.mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global The GLSL shader program */
var shaderProgram;

/** @global The angle of rotation around the y axis */
var viewRot = 0;

/** @global A glmatrix vector to use for transformations */
var transformVec = glMatrix.vec3.create();

// Initialize the vector....
glMatrix.vec3.set(transformVec, 0.0, -0.25, -2.0);

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = glMatrix.vec3.fromValues(0.0, 0.1, -1.2);
/** @global Direction of the view in world coordinates */
var viewDir = glMatrix.vec3.fromValues(0.0, -0.25, -1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0, 1, 3];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0, 0, 0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1, 1, 1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular = [0, 0, 0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0, 1.0, 1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0 / 255.0, 163.0 / 255.0, 63.0 / 255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0, 0.0, 0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0, 0.0, 0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0, 1.0, 1.0];

var fogFlag = true;
var currentPressedKey = {};
var rotationQuat = glMatrix.quat.create();
var movement = glMatrix.vec3.create();
var speed = 0.001;
// -------------------------------------------------------------------------

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform,
    false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  glMatrix.mat3.fromMat4(nMatrix, mvMatrix);
  glMatrix.mat3.transpose(nMatrix, nMatrix);
  glMatrix.mat3.invert(nMatrix, nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
  var copy = glMatrix.mat4.clone(mvMatrix);
  mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Size the size of the viewport for responsive design
 * @param {element} context WebGL context 
 * @param {element} canvas WebGL canvas
 */
function setViewportSize(context, canvas) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  context.viewportWidth = canvas.width;
  context.viewportHeight = canvas.height;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
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
    setViewportSize(context, canvas);
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);

  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
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

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
  shaderProgram.uniformMaxZLoc = gl.getUniformLocation(shaderProgram, "maxZ");
  shaderProgram.uniformMinZLoc = gl.getUniformLocation(shaderProgram, "minZ");
  shaderProgram.uniformFogFlagLoc = gl.getUniformLocation(shaderProgram, "uFogFlag");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha, a, d, s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc, a, d, s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

/**
 * Sends maxZ and minZ to the shader
 * @param {Float32} maxZ 
 * @param {Float32} minZ 
 */
function setZUniforms(maxZ, minZ) {
  gl.uniform1f(shaderProgram.uniformMaxZLoc, maxZ);
  gl.uniform1f(shaderProgram.uniformMinZLoc, minZ);
}

/**
 * Send fogFlag to the shader
 * @param {Bool} fogFlag 
 */
function setFogFlagUinform(fogFlag) {
  gl.uniform1i(shaderProgram.uniformFogFlagLoc, fogFlag);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
  myTerrain = new Terrain(300, -2.0, 2.0, -2.0, 2.0);
  myTerrain.loadBuffers();
}

/**
 * Draw the content onto the canvas.
 */
function draw() {
  //console.log("function draw()")
  //var transformVec = glMatrix.vec3.create();

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // We'll use perspective 
  glMatrix.mat4.perspective(pMatrix, degToRad(55), gl.viewportWidth / gl.viewportHeight, 0.01, 200.0);

  // We want to look down -z, so create a lookat point in that direction    
  glMatrix.vec3.add(viewPt, eyePt, viewDir);
  // Then generate the lookat matrix and initialize the MV matrix to that view
  glMatrix.mat4.lookAt(mvMatrix, eyePt, viewPt, up);
  // Rotate the MV matrix using rotation matrix
  //glMatrix.mat4.multiply(mvMatrix, rotationMatrix, mvMatrix);
  // Move the MV matrix along current direction
  //glMatrix.mat4.multiply(mvMatrix, movementMatrix, mvMatrix);

  //Draw Terrain
  mvPushMatrix();
  //glMatrix.vec3.set(transformVec, 0.0, -0.25, -2.0);
  glMatrix.mat4.translate(mvMatrix, mvMatrix, transformVec);
  glMatrix.mat4.rotateY(mvMatrix, mvMatrix, degToRad(viewRot));
  glMatrix.mat4.rotateX(mvMatrix, mvMatrix, degToRad(-90));
  setMatrixUniforms();
  setLightUniforms(lightPosition, lAmbient, lDiffuse, lSpecular);
  setZUniforms(myTerrain.maxZ, myTerrain.minZ);
  setFogFlagUinform(fogFlag);

  if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked)) {
    setMaterialUniforms(shininess, kAmbient, kTerrainDiffuse, kSpecular);
    myTerrain.drawTriangles();
  }

  if (document.getElementById("wirepoly").checked) {
    setMaterialUniforms(shininess, kAmbient, kEdgeBlack, kSpecular);
    myTerrain.drawEdges();
  }

  if (document.getElementById("wireframe").checked) {
    setMaterialUniforms(shininess, kAmbient, kEdgeWhite, kSpecular);
    myTerrain.drawEdges();
  }
  mvPopMatrix();
}

/**
 * Animation to be called from tick. Update buffers every tick.
 */
function animate() {
  var roll = 0;
  var pitch = 0;

  // Press Keys
  if (currentPressedKey["ArrowLeft"]) roll -= degToRad(1);
  if (currentPressedKey["ArrowRight"]) roll += degToRad(1);
  if (currentPressedKey["ArrowUp"]) pitch -= degToRad(1);
  if (currentPressedKey["ArrowDown"]) pitch += degToRad(1);
  if (currentPressedKey["+"]) speed += 0.0001;
  if (currentPressedKey["-"]) speed -= 0.0001;
  if (speed > 0.008) speed = 0.008;
  if (speed < 0.0005) speed = 0.0005;

  // Rolling
  glMatrix.quat.setAxisAngle(rotationQuat, viewDir, roll);
  glMatrix.vec3.transformQuat(viewDir, viewDir, rotationQuat);
  glMatrix.vec3.transformQuat(up, up, rotationQuat);

  // Pitching
  var normal = glMatrix.vec3.create();
  glMatrix.vec3.cross(normal, viewDir, up);
  glMatrix.quat.setAxisAngle(rotationQuat, normal, pitch);
  glMatrix.vec3.transformQuat(viewDir, viewDir, rotationQuat);
  glMatrix.vec3.transformQuat(up, up, rotationQuat);

  // Movement
  glMatrix.vec3.scale(movement, viewDir, speed);
  glMatrix.vec3.negate(movement, movement);
  glMatrix.vec3.add(transformVec, transformVec, movement);
}

/**
 * Tick called for every animation frame.
 */
function tick() {
  requestAnimationFrame(tick);
  setViewportSize(gl, canvas);
  animate();
  draw();
}

/**
 * The main function which starts the program.
 */
function main() {
  canvas = document.getElementById("glCanvas");
  gl = createGLContext(canvas);

  gl.clearColor(0.0, 0.0, 0.25, 0.9);
  gl.enable(gl.DEPTH_TEST);

  setupShaders();
  setupBuffers();

  handleEvent();

  tick();
}

/**
 * Handle events from DOM
 */
function handleEvent() {
  // Handle fogOn and fogOff
  var fogOn = document.getElementById("fogOn");
  var fogOff = document.getElementById("fogOff");
  fogOn.onclick = () => { fogFlag = true; };
  fogOff.onclick = () => { fogFlag = false; };

  // Handle Keydown
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
}

/**
 * Handle Key Down event
 */
function handleKeyDown(event) {
  //console.log("Key down", event.key, "code ", event.code);
  if (event.key == "ArrowDown" || event.key == "ArrowUp" || event.key == "ArrowLeft" || event.key == "ArrowRight") event.preventDefault();
  currentPressedKey[event.key] = true;
}

/**
 * Handle Key Up event
 */
function handleKeyUp(event) {
  //console.log("Key up", event.key, "code ", event.code);
  currentPressedKey[event.key] = false;
}
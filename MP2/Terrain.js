/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 * @author Navi Ning <xning5@illinois.edu>
 */

/** Class implementing 3D terrain. */
class Terrain {
  /**
   * Initialize members of a Terrain object
   * @param {number} div Number of triangles along x axis and y axis
   * @param {number} minX Minimum X coordinate value
   * @param {number} maxX Maximum X coordinate value
   * @param {number} minY Minimum Y coordinate value
   * @param {number} maxY Maximum Y coordinate value
   */
  constructor(div, minX, maxX, minY, maxY) {
    this.div = div;
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;

    // Allocate vertex array
    this.vBuffer = [];
    // Allocate triangle array
    this.fBuffer = [];
    // Allocate normal array
    this.nBuffer = [];
    // Allocate array for edges so we can draw wireframe
    this.eBuffer = [];
    console.log("Terrain: Allocated buffers");

    this.generateTriangles();
    console.log("Terrain: Generated triangles");

    this.generateLines();
    console.log("Terrain: Generated lines");

    // Get extension for 4 byte integer indices for drwElements
    var ext = gl.getExtension('OES_element_index_uint');
    if (ext == null) {
      alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
    }
  }

  /**
  * Set the x,y,z coords of a vertex at location(i,j)
  * @param {Object} v an an array of length 3 holding x,y,z coordinates
  * @param {number} i the ith row of vertices
  * @param {number} j the jth column of vertices
  */
  setVertex(v, i, j) {
    //Your code here
    var vid = (i * (this.div + 1) + j) * 3;
    this.vBuffer[vid] = v[0];
    this.vBuffer[vid + 1] = v[1];
    this.vBuffer[vid + 2] = v[2];
  }

  /**
  * Return the x,y,z coordinates of a vertex at location (i,j)
  * @param {Object} v an an array of length 3 holding x,y,z coordinates
  * @param {number} i the ith row of vertices
  * @param {number} j the jth column of vertices
  */
  getVertex(v, i, j) {
    //Your code here
    var vid = (i * (this.div + 1) + j) * 3;
    v[0] = this.vBuffer[vid];
    v[1] = this.vBuffer[vid + 1];
    v[2] = this.vBuffer[vid + 2];
  }

  /**
  * Send the buffer objects to WebGL for rendering 
  */
  loadBuffers() {
    // Specify the vertex coordinates
    this.VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
    this.VertexPositionBuffer.itemSize = 3;
    this.VertexPositionBuffer.numItems = this.numVertices;
    console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");

    // Specify normals to be able to do lighting calculations
    this.VertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
      gl.STATIC_DRAW);
    this.VertexNormalBuffer.itemSize = 3;
    this.VertexNormalBuffer.numItems = this.numVertices;
    console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");

    // Specify faces of the terrain 
    this.IndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
      gl.STATIC_DRAW);
    this.IndexTriBuffer.itemSize = 1;
    this.IndexTriBuffer.numItems = this.fBuffer.length;
    console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");

    //Setup Edges  
    this.IndexEdgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
      gl.STATIC_DRAW);
    this.IndexEdgeBuffer.itemSize = 1;
    this.IndexEdgeBuffer.numItems = this.eBuffer.length;

    console.log("triangulatedPlane: loadBuffers");
  }

  /**
  * Render the triangles 
  */
  drawTriangles() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
      this.VertexNormalBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

    //Draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
    gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT, 0);
  }

  /**
  * Render the triangle edges wireframe style 
  */
  drawEdges() {

    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
      this.VertexNormalBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

    //Draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
    gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT, 0);
  }

  /**
   * Fill the vertex and buffer arrays 
   */
  generateTriangles() {
    //Your code here
    var deltaX = (this.maxX - this.minX) / this.div;
    var deltaY = (this.maxY - this.minY) / this.div;

    for (var i = 0; i <= this.div; i++) {
      for (var j = 0; j <= this.div; j++) {
        this.vBuffer.push(this.minX + deltaX * j);
        this.vBuffer.push(this.minY + deltaY * i);
        this.vBuffer.push(0);

        this.nBuffer.push(0);
        this.nBuffer.push(0);
        this.nBuffer.push(0);
      }
    }

    this.numVertices = this.vBuffer.length / 3;

    this.updateVertices();

    for (var i = 0; i < this.div; i++) {
      for (var j = 0; j < this.div; j++) {
        var vid = i * (this.div + 1) + j;
        this.fBuffer.push(vid);
        this.fBuffer.push(vid + 1);
        this.fBuffer.push(vid + this.div + 1);

        this.fBuffer.push(vid + 1);
        this.fBuffer.push(vid + 1 + this.div + 1);
        this.fBuffer.push(vid + this.div + 1);
      }
    }

    this.numFaces = this.fBuffer.length / 3;

    this.updateNormals();

  }

  /**
   * Generate the plane by randomly devide the vertices
   */
  updateVertices() {
    // Number of iterations
    var it = 200;
    // Adjustment of each iteration
    var delta = 0.0035;

    for (var i = 0; i < it; i++) {
      var p = [Math.random() * (this.maxX - this.minX) + this.minX, Math.random() * (this.maxY - this.minY) + this.minY];
      var n = glMatrix.vec2.create();
      glMatrix.vec2.random(n);
      for (var j = 0; j < this.numVertices; j++) {
        var b = [this.vBuffer[j * 3], this.vBuffer[j * 3 + 1]];
        if ((b[0] - p[0]) * n[0] + (b[1] - p[1]) * n[1] > 0) {
          this.vBuffer[j * 3 + 2] += delta;
        } else {
          this.vBuffer[j * 3 + 2] -= delta;
        }
      }
    }
  }

  /**
   * Calculate per-vertex normals
   */
  updateNormals() {
    for (var i = 0; i < this.numFaces; i++) {
      var vid1 = this.fBuffer[i * 3];
      var vid2 = this.fBuffer[i * 3 + 1];
      var vid3 = this.fBuffer[i * 3 + 2];

      var v1 = [this.vBuffer[vid1 * 3], this.vBuffer[vid1 * 3 + 1], this.vBuffer[vid1 * 3 + 2]];
      var v2 = [this.vBuffer[vid2 * 3], this.vBuffer[vid2 * 3 + 1], this.vBuffer[vid2 * 3 + 2]];
      var v3 = [this.vBuffer[vid3 * 3], this.vBuffer[vid3 * 3 + 1], this.vBuffer[vid3 * 3 + 2]];
      var n1 = [this.nBuffer[vid1 * 3], this.nBuffer[vid1 * 3 + 1], this.nBuffer[vid1 * 3 + 2]];
      var n2 = [this.nBuffer[vid2 * 3], this.nBuffer[vid2 * 3 + 1], this.nBuffer[vid2 * 3 + 2]];
      var n3 = [this.nBuffer[vid3 * 3], this.nBuffer[vid3 * 3 + 1], this.nBuffer[vid3 * 3 + 2]];

      // Compute Normal vector
      var t1 = glMatrix.vec3.create();
      glMatrix.vec3.sub(t1, v2, v1);
      var t2 = glMatrix.vec3.create();
      glMatrix.vec3.sub(t2, v3, v1);
      var n = glMatrix.vec3.create();
      glMatrix.vec3.cross(n, t1, t2);

      // Add to vertices
      glMatrix.vec3.add(n1, n1, n);
      glMatrix.vec3.add(n2, n2, n);
      glMatrix.vec3.add(n3, n3, n);
      [this.nBuffer[vid1 * 3], this.nBuffer[vid1 * 3 + 1], this.nBuffer[vid1 * 3 + 2]] = n1;
      [this.nBuffer[vid2 * 3], this.nBuffer[vid2 * 3 + 1], this.nBuffer[vid2 * 3 + 2]] = n2;
      [this.nBuffer[vid3 * 3], this.nBuffer[vid3 * 3 + 1], this.nBuffer[vid3 * 3 + 2]] = n3;
    }

    // Normalize
    for (var i = 0; i < this.numVertices; i++) {
      var n = [this.nBuffer[i * 3], this.nBuffer[i * 3 + 1], this.nBuffer[i * 3 + 2]];
      glMatrix.vec3.normalize(n, n);
      [this.nBuffer[i * 3], this.nBuffer[i * 3 + 1], this.nBuffer[i * 3 + 2]] = n;
    }

  }

  /**
   * Print vertices and triangles to console for debugging
   */
  printBuffers() {

    for (var i = 0; i < this.numVertices; i++) {
      console.log("v ", this.vBuffer[i * 3], " ",
        this.vBuffer[i * 3 + 1], " ",
        this.vBuffer[i * 3 + 2], " ");

    }

    for (var i = 0; i < this.numFaces; i++) {
      console.log("f ", this.fBuffer[i * 3], " ",
        this.fBuffer[i * 3 + 1], " ",
        this.fBuffer[i * 3 + 2], " ");

    }

    for (var i = 0; i < this.numVertices; i++) {
      console.log("n ", this.nBuffer[i * 3], " ",
        this.nBuffer[i * 3 + 1], " ",
        this.nBuffer[i * 3 + 2], " ");

    }
  }

  /**
   * Generates line values from faces in faceArray
   * to enable wireframe rendering
   */
  generateLines() {
    var numTris = this.fBuffer.length / 3;
    for (var f = 0; f < numTris; f++) {
      var fid = f * 3;
      this.eBuffer.push(this.fBuffer[fid]);
      this.eBuffer.push(this.fBuffer[fid + 1]);

      this.eBuffer.push(this.fBuffer[fid + 1]);
      this.eBuffer.push(this.fBuffer[fid + 2]);

      this.eBuffer.push(this.fBuffer[fid + 2]);
      this.eBuffer.push(this.fBuffer[fid]);
    }

  }

}

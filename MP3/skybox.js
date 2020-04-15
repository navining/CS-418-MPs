/**
 * @fileoverview SkyBox - a cubic mesh for skybox
 * @author Navi Ning
 */

class SkyBox {
  /**
   * Initialize members of a SkyBox object
   */
  constructor() {
    this.isLoaded = false;
    this.width = 15;
    this.numFaces = 0;
    this.numVertices = 0;

    // Allocate vertex array
    this.vBuffer = [];
    // Allocate triangle array
    this.fBuffer = [];
    // Allocate normal array
    this.nBuffer = [];

    console.log("SkyBox: Allocated buffers");

    // Get extension for 4 byte integer indices for drawElements
    var ext = gl.getExtension('OES_element_index_uint');
    if (ext == null) {
      alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
    }
    else {
      console.log("OES_element_index_uint is supported!");
    }

    this.createMesh();
    console.log("SkyBox: Mesh created");
  }

  /**
  * Return if the JS arrays have been populated with mesh data
  */
  loaded() {
    return this.isLoaded;
  }

  /**
   * Create mesh for skybox
   */
  createMesh() {
    var w = this.width;
    this.vBuffer = [
      -w, -w, w,
      w, -w, w,
      w, w, w,
      -w, w, w,
      -w, -w, -w,
      w, -w, -w,
      w, w, -w,
      -w, w, -w,
    ];

    this.numVertices = 24;

    const faces = [
      {
        f: [0, 1, 2, 0, 3, 2],
        n: [0, 0, 1]
      },
      {
        f: [4, 5, 6, 4, 7, 6],
        n: [0, 0, -1]
      },
      {
        f: [3, 2, 6, 3, 7, 6],
        n: [0, 1, 0]
      },
      {
        f: [0, 1, 5, 0, 4, 5],
        n: [0, -1, 0]
      },
      {
        f: [2, 1, 5, 2, 6, 5],
        n: [1, 0, 0]
      },
      {
        f: [4, 0, 3, 4, 7, 3],
        n: [-1, 0, 0]
      },
    ];

    for (var i = 0; i < faces.length; i++) {
      var face = faces[i]['f'];
      for (var j = 0; j < face.length; j++) {
        this.fBuffer.push(face[j]);
      }
    }

    this.numFaces = 12;

    //----------------
    console.log("SkyBox: Loaded ", this.numFaces, " triangles.");
    console.log("SkyBox: Loaded ", this.numVertices, " vertices.");

    this.loadBuffers();
    this.isLoaded = true;
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

    // Specify faces of the terrain 
    this.IndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
      gl.STATIC_DRAW);
    this.IndexTriBuffer.itemSize = 1;
    this.IndexTriBuffer.numItems = this.fBuffer.length;
    console.log("Loaded ", this.IndexTriBuffer.numItems / 3, " triangles");
  }

  /**
    * Render the triangles 
    */
  drawTriangles() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.vertexAttribPointer(skyboxShaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

    //Draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
    gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT, 0);
  }
}
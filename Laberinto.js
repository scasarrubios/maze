var gl;

var VSHADER_SOURCE =
  'attribute highp vec3 a_VertexPosition;\n' +
  'attribute highp vec2 a_TextureCoord;\n' +
  'attribute highp vec3 a_VertexNormal;\n' +
  'uniform highp mat4 u_NormalMatrix;\n' +
  'uniform highp mat4 u_MvpMatrix;\n' +
  'uniform highp mat4 u_ModelMatrix;\n' +
  'varying highp vec2 v_TextureCoord;\n' +
  'varying highp vec3 v_Lighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * vec4(a_VertexPosition, 1.0);\n' +
  '  v_TextureCoord = a_TextureCoord;\n' +

  '  highp vec3 ambientLight = vec3(0.4, 0.15, 0.85);\n' +
  '  highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);\n' +
  '  highp vec3 pointLightPosition = vec3(1.0, -10.0, 0.0);\n' +

  '  vec4 vertexPosition = u_ModelMatrix * vec4(a_VertexPosition, 1.0);\n' +
  '  highp vec3 lightDirection = normalize(pointLightPosition - vec3(vertexPosition));\n' +
  '  highp vec4 transformedNormal = u_NormalMatrix * vec4(a_VertexNormal, 1.0);\n' +
  '  highp float directionalW = max(dot(transformedNormal.xyz, lightDirection), 0.0);\n' +

  '  v_Lighting = ambientLight + (directionalLightColor * directionalW);\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'varying highp vec3 v_Lighting;\n' +
  'varying highp vec2 v_TextureCoord;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'void main() {\n' +
  '  highp vec4 texelColor = texture2D(u_Sampler, vec2(v_TextureCoord.s, v_TextureCoord.t));\n' +
  '  gl_FragColor = vec4(texelColor.rgb * v_Lighting, texelColor.a);\n' +
  '}\n';

function main() {
  var canvas = document.getElementById('webgl');
  //canvas.width = window.innerWidth-700;
  //canvas.height = window.innerHeight-300;
	var canvas2d = document.getElementById('2d');
	var ctx_2d = canvas2d.getContext("2d");
  var camera = new cameraMaker();
  var speed = 0.05; //var angle = 0.25;
  var my_maze = new Maze(MAZESZ);
  var maze_3D = new Array();
  var drawables = new Array();

	my_maze.randPrim(new Pos(0, 0));
	//my_maze.determ(new Pos(0, 0));
	my_maze.pos.x = camera.PosX;
	my_maze.pos.y = camera.PosY;
	my_maze.draw(ctx_2d, 0, 0, 5, 0);

  create3DMaze(my_maze, maze_3D);

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  if (gl) {
    gl.clearColor(0.5, 0.5, 0.5, 1);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Vértices de los cubos
      var cubeVertices = new Float32Array([
        -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,   // Front face
        -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,   // Back face
        -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,   // Top face
        -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,   // Bottom face
         0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,   // Right face
        -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5    // Left face
      ]);

      var cubeVertexNormals = new Float32Array([
        0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,   // Front face
        0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,   // Back face
        0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,   // Top face
        0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,   // Bottom face
        1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,   // Right face
        -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0   // Left face
      ]);

      var cubeTextureCoordinates = new Float32Array([
        0.0,  0.0,     1.0,  0.0,     1.0,  1.0,     0.0,  1.0,  // Front
        0.0,  0.0,     1.0,  0.0,     1.0,  1.0,     0.0,  1.0,  // Back
        0.0,  0.0,     1.0,  0.0,     1.0,  1.0,     0.0,  1.0,  // Top
        0.0,  0.0,     0.0,  1.0,     1.0,  1.0,     1.0,  0.0,  // Bottom
        0.0,  0.0,     0.0,  1.0,     1.0,  1.0,     1.0,  0.0,  // Right
        0.0,  0.0,     1.0,  0.0,     1.0,  1.0,     0.0,  1.0   // Left
      ]);

      var cubeIndices =  new Uint16Array([
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
      ]);
  //Vértices y modelo del suelo
      var floorVertices = new Float32Array([
        -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5   // Back face
      ]);

      var floorVertexNormals = new Float32Array([
        0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0   // Back face
      ]);

      var floorTextureCoordinates = new Float32Array([
        0.0,  0.0,     MAZESZ*4,  0.0,     MAZESZ*4,  MAZESZ*4,     0.0,  MAZESZ*4   // Back face
      ]);

      var floorIndices =  new Uint16Array([
        0,  1,  2,      0,  2,  3    // back
      ]);

      mFloor = new Matrix4();
      mFloor.setTranslate(MAZESZ/2, MAZESZ/2, 0).scale(MAZESZ,MAZESZ,1);
      floorModel = new Array();
      floorModel.push(mFloor)


    var walls = new Element(cubeVertices, cubeVertexNormals,
          cubeTextureCoordinates, cubeIndices, maze_3D, "resources/bricks.png");

    var floor = new Element(floorVertices, floorVertexNormals,
          floorTextureCoordinates, floorIndices, floorModel, "resources/marbletexture.png");

    drawables.push(walls);
    drawables.push(floor);

    init(drawables, camera, my_maze);

    requestAnimationFrame(function(){drawScene(camera, drawables, my_maze, ctx_2d)}, my_maze);
  }

  function keyHandler(ev) {

      switch(ev.keyCode){
        case 87:
          camera.move(speed, camera, my_maze);
          break;
        case 83:
          camera.move(-speed, camera, my_maze);
          break;
        case 68:
          camera.roteXY(+8*angle);
          break;
        case 65:
          camera.roteXY(-8*angle);
          break;
        case 49:
          camera.roteZ(+angle);
          break;
        case 50:
          camera.roteZ(-angle);
          break;
        default: return; // Prevent the unnecessary drawing
      }
      console.log(camera.PosX, camera.PosY, camera.RotX, camera.RotY, camera.RotZ)
  }

  function mouseHandler(ev){

    camera.mouseX = ev.clientX;
    camera.mouseY = ev.clientY;
  }
  
  function lookAround(){

    camera.offX = camera.mouseX - canvas.width/2;
    camera.roteXY(camera.offX*0.007)
    camera.offY = camera.mouseY - canvas.height/2;
    camera.roteZ(camera.offY*0.007)
  }

  document.addEventListener('keydown', keyHandler, false);
  document.addEventListener('mousemove', mouseHandler, false);
  mouseInterval = setInterval(lookAround, 20)

}
  
function Element(vertices, verticesNormales, coordsTexturas, indices, models, src){
  this.verticesBuffer;
  this.verticesTextureCoordBuffer;
  this.verticesIndexBuffer;
  this.verticesNormalBuffer;
  this.vertices = vertices;
  this.verticesNormales = verticesNormales;
  this.coordsTexturas = coordsTexturas;
  this.indices = indices;
  this.models = models;
  this.image = new Image();
  this.image.src = src;

  this.initBuffers = function() {

    this.verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    this.verticesNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.verticesNormales, gl.STATIC_DRAW);

    // Map the texture onto the cube's faces.

    this.verticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.coordsTexturas, gl.STATIC_DRAW);

    this.verticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

  }

  this.initTextures = function() {
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
    handleTextureLoaded(this.image, this.texture)
  };

  this.draw = function(mvpMatrix, pMatrix, vMatrix){

    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
      console.log('Failed to get the storage location of u_MvpMatrix');
      return;
    }

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }

    vertexPositionAttribute = gl.getAttribLocation(gl.program, "a_VertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    textureCoordAttribute = gl.getAttribLocation(gl.program, "a_TextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    vertexNormalAttribute = gl.getAttribLocation(gl.program, "a_VertexNormal");
    gl.enableVertexAttribArray(vertexNormalAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesTextureCoordBuffer);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesNormalBuffer);
    gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(gl.program, "u_Sampler"), 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);

    for(var i=0; i<this.models.length; i++){
      mMatrix = this.models[i]

      mvpMatrix.set(pMatrix).multiply(vMatrix).multiply(mMatrix);

      gl.uniformMatrix4fv(u_ModelMatrix, false, mMatrix.elements);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }

  }
}

function cameraMaker(){
    this.PosX = 0;
    this.PosY = 0;
    this.RotX = 0;
    this.RotY = 0;
    this.radsXY = 0;
    this.RotZ = 0;
    this.radsZX = 0;
    this.offX = 0;
    this.offY = 0;
    this.mouseX = 0;
    this.mouseY = 0;

    this.move = function(speed, camera, my_maze) {
      if(!crashed(camera, my_maze, speed)){
        this.PosX += speed * Math.cos(this.radsXY);
        this.PosY -= speed * Math.sin(this.radsXY);
      }
    }
    this.roteXY = function(angle) {
      this.radsXY += angle * Math.PI / 180;
      this.RotX = Math.cos(-this.radsXY) * Math.cos(-this.radsZX);
      this.RotY = Math.sin(-this.radsXY) * Math.cos(-this.radsZX);
    }
    this.roteZ = function(angle) {
      this.radsZX += angle * Math.PI / 180;
      this.RotZ = Math.sin(-this.radsZX);
    }
  };

function create3DMaze(my_maze, maze_3D){
  for(var i=0; i<my_maze.rooms.length; i++){
     for(var j=0; j<my_maze.rooms.length; j++){
      if(!my_maze.rooms[i][j]){
        aux_model = new Matrix4();
        aux_model.setTranslate(i+0.5, j+0.5, 0).scale(1,1,1);
        maze_3D.push(aux_model)
      }
     }
  }
};

function handleTextureLoaded(image, texture, my_maze) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function init(drawables, camera, my_maze){

  for(var i=0; i<drawables.length; i++){
    drawables[i].initBuffers()
    drawables[i].initTextures()
  }
  var x=MAZESZ/2; var y=MAZESZ/2;
  do {
        camera.PosX = x;
        camera.PosY = y;
        x++;
    }
  while (x<my_maze.rooms.length && !my_maze.rooms[x][y]);
  
}

function crashed(camera, my_maze, speed){

  for(var i=0; i<my_maze.rooms.length; i++){
    for(var j=0; j<my_maze.rooms.length; j++){
      if(!my_maze.rooms[i][j] && Math.floor(camera.PosX+2*speed*camera.RotX)==i
          && Math.floor(camera.PosY+2*speed*camera.RotY)==j){

        return true;
        camera.PosX -= speed* Math.cos(camera.radsXY);
        camera.PosY += speed* Math.sin(camera.radsXY);
      }
    }
  }
}

function drawScene(camera, drawables, my_maze, ctx_2d) {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var mMatrix   = new Matrix4();
  var vMatrix   = new Matrix4();
  var pMatrix   = new Matrix4();
  var mvpMatrix = new Matrix4();

  pMatrix.setPerspective(60, 1, 0.0001, 100);
  vMatrix.setLookAt(camera.PosX, camera.PosY, -0.01, camera.PosX + camera.RotX, camera.PosY + camera.RotY, -0.01+ camera.RotZ, 0, 0, 1);
  //vMatrix.setLookAt(5, 10, 100, 5, 5, 5, 0, 0, 1);

  my_maze.pos.x = Math.floor(camera.PosX);
	my_maze.pos.y = Math.floor(camera.PosY);
	my_maze.draw(ctx_2d, 0, 0, 5, 0);

  for(var i=0; i<drawables.length; i++){
    drawables[i].draw(mvpMatrix, pMatrix, vMatrix);
  }

  var normalMatrix = new Matrix4();
  normalMatrix.set(mMatrix);
  normalMatrix.invert();
  normalMatrix.transpose();
  var nUniform = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  gl.uniformMatrix4fv(nUniform, false, normalMatrix.elements);


  requestAnimationFrame(function(){drawScene(camera, drawables, my_maze, ctx_2d)});
}

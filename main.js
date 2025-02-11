
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = false;
var controller;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time. You could very easily make a higher level object that stores these as Position, Rotation (and also Scale!)
var sphereRotation = [0,0,0];
var spherePosition = [-4,0,0];

var cubeRotation = [0,0,0];
var cubePosition = [-1,0,0];

var cylinderRotation = [0,0,0];
var cylinderPosition = [1.1,0,0];

var coneRotation = [0,0,0];
var conePosition = [3,0,0];

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
        //console.log(animFlag);
    };

    render(0);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result, x, y, and z are the translation amounts for each axis
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result, theta is the rotation amount, x, y, z are the components of an axis vector (angle, axis rotations!)
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result, x, y, and z are the scale amounts for each axis
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

var TIME = 0; // Time tracker for animation
var prevTime = 0; // Track the last frame's time

let jellyfishAngle = 0; // Angle for circular motion

function animateJellyfish(dt) {
    jellyfishAngle += dt * 20; // Adjust speed (20 degrees per second)
    
    let x = Math.cos(radians(jellyfishAngle)) * 3; // Move in X
    let y = Math.sin(radians(jellyfishAngle * 0.7)) * 1.5; // Up & Down bobbing
    let z = Math.sin(radians(jellyfishAngle)) * 3; // Move in Z

    gTranslate(x, 2 + y, z); // Move the entire jellyfish (without rotation)
}


function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute delta time (dt)
    let dt = (timestamp - prevTime) / 1000.0; // Convert from ms to seconds
    prevTime = timestamp;
    if (animFlag) TIME += dt; // Increment animation time

    eye = vec3(0, 0, 10);
    MS = []; // Initialize modeling matrix stack
	
    // Initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // Set the camera matrix
    viewMatrix = lookAt(eye, at, up);
   
    // Set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    // Set all the matrices
    setAllMatrices();

    // Move Jellyfish in a Circular Path
    gPush();
        animateJellyfish(dt); // Apply floating movement

        // Draw Jellyfish Body
        drawJellyfishBody();

        // Draw Tentacles with Animation
        drawTentacle(-0.5, 0); // Left tentacle
        drawTentacle(0, 1);    // Middle tentacle
        drawTentacle(0.5, 2);  // Right tentacle
    gPop();

    if (animFlag) {
        window.requestAnimFrame(render);
    }
}

function drawJellyfishBody() {
    // Draw the larger disk (head)
    gPush();
        gTranslate(0, 2.5, 0); // Position above the body
        gScale(1.2, 0.7, 1.2); // Larger disk-like sphere
        setColor(vec4(0.5, 0.2, 0.8, 1.0)); // Purple color
        drawSphere();
    gPop();

    // Draw the smaller disk (body)
    gPush();
        gTranslate(0, 2, 0); // Position slightly below the head
        gScale(0.9, 0.5, 0.9); // Smaller, flatter sphere
        setColor(vec4(0.5, 0.2, 0.8, 1.0)); // Same purple color
        drawSphere();
    gPop();
}

function drawTentacle(xOffset, tentacleIndex) {
    gPush();
      gTranslate(xOffset, 1.5, 0); // Move up slightly to attach to body
      for (let i = 0; i < 5; i++) {
        gTranslate(0, -0.5, 0); // Move each segment downward
        
        let angle = Math.sin(TIME * 2 + i + tentacleIndex) * 20; // Oscillation
        gRotate(angle, 1, 0, 0); // Rotate in the x direction (waving effect)

        gScale(0.15, 0.7, 0.15); // Thinner tentacles
        setColor(vec4(0.6, 0.48, 0.0, 1.0)); // Tentacle color (RGB 153, 122, 0)
        drawSphere();
      }
    gPop();
}






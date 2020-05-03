/**
 * @file Particle.js
 * @description An abstract structure of a particle
 * @author Navi Ning <xning5@illinois.edu>
 */

// Time step
var step = 0.08;
// Gravity
var gravity = 9.8;
// Drag Force
var drag = 0.1;
// Bouncing factor
var bouncing = 0.95;

/**
 * Update gravity, drag and bouncing factors
 */
function updateParameters() {
  gravity = parseFloat(document.getElementById("gravity").value);
  document.getElementById("gravityValue").innerHTML = gravity;
  drag = parseFloat(document.getElementById("drag").value);
  document.getElementById("dragValue").innerHTML = drag;
  bouncing = parseFloat(document.getElementById("bouncing").value);
  document.getElementById("bouncingValue").innerHTML = bouncing;
}

class Particle {
  /**
   * The constructor
   */
  constructor() {
    // Position
    this.p = vec3.create();
    vec3.random(this.p);
    // Velocity
    this.v = vec3.create();
    vec3.random(this.v);
    // Acceleration
    this.a = [0, -0.1 * gravity, 0];
    // Radius
    this.r = 0.05 + Math.random() * 0.05;
    // Color
    this.R = Math.random();
    this.G = Math.random();
    this.B = Math.random();
  }

  /**
   * Update the position using the current velocity and Euler integration
   */
  updatePosition() {
    var increment = vec3.create();
    vec3.scale(increment, this.v, step);
    vec3.add(this.p, this.p, increment);

    for (var i = 0; i < 3; i++) {
      if (this.p[i] < -1) {
        this.p[i] = -1;
        this.v[i] = -this.v[i] * bouncing;
      }
      if (this.p[i] > 1) {
        this.p[i] = 1;
        this.v[i] = -this.v[i] * bouncing;
      }
    }
  }

  /**
   * Update the velocity using the acceleration and Euler integration and drag
   */
  updateVelocity() {
    vec3.scale(this.v, this.v, Math.pow((1 - drag), step));
    var increment = vec3.create();
    vec3.scale(increment, this.a, step);
    vec3.add(this.v, this.v, increment);
  }

  /**
   * Update the acceleration using the forces of gravity
   */
  updateAcceleration() {
    this.a = [0, -0.1 * gravity, 0];
  }
}
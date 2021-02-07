import * as THREE from 'three';
// import Stats from 'stats.js';
import noise from 'perlin.js';
import gsap from 'gsap';
import { vShader, fShader } from './shaders';

const container = document.querySelector('#js-sphere');
const highlights = document.querySelector('#js-highlights');
// const stats = new Stats();
const clock = new THREE.Clock();

let edge;
let containerWidth = container.offsetWidth;
let containerHeight = window.innerHeight - highlights.offsetHeight;
let aspectRatio = 1;
let spikes = {
  height: 0.6 // Higher for more spikes
};

function calculateEdge() {
  if (containerWidth >= containerHeight) {
    edge = containerHeight;
  } else {
    edge = containerWidth;
  }
}

const VIEW_ANGLE = 40;
const NEAR = 0.1;
const FAR = 4;

const uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib[ "lights" ],
  {
    u_time: { value: 0.0 },
    lightIntensity: { type: 'f', value: 1.0 },
    color1: {
      type: "c",
      value: new THREE.Color(0xFFE78E)
    },
    color2: {
      type: "c",
      value: new THREE.Color(0xAADDD6)
    }
  }
]);

const scene = createScene();
const renderer = createRenderer();
const camera = createCamera();
const lights = createLights();
const mesh = createMesh();

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x004F48 );
  return scene;
}

function createRenderer() {
  calculateEdge();
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.gammaFactor = 2.2;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(edge, edge);
  container.appendChild(renderer.domElement);
  return renderer;
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspectRatio, NEAR, FAR);
  camera.position.z = 4;
  scene.add(camera);
  return camera;
}

function createLights() {
  const light = new THREE.PointLight( 0xffffff, 0.5, 0 );
  light.position.set( 3, 1, 3 );
  scene.add( light );
  return light;
}

function createMesh() {
  const material = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms,
    lights: true
  });
  const geometry = new THREE.SphereBufferGeometry(1, 128, 128);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

const position = mesh.geometry.getAttribute('position');
const count = position.count;
const length = position.array.length;
const vertices = position.array;
let updatedVertices = new Float32Array( length );
let newPosition = new THREE.BufferAttribute( updatedVertices, 3 );
let v = new THREE.Vector3();
let x, y, z;
let index;

function updateBufferMesh() {
  index = 0;
  for ( let i = 0, l = count; i < l; i++ ) {
    x = vertices[index++];
    y = vertices[index++];
    z = vertices[index++];
    v.set(x, y, z);
    v.normalize()
      .multiplyScalar(1 + 0.09 *
        noise.simplex3(v.x * spikes.height + (uniforms.u_time.value * 0.3), v.y * spikes.height, v.z * spikes.height));
    updatedVertices[index - 3] = v.x;
    updatedVertices[index - 2] = v.y;
    updatedVertices[index - 1] = v.z;
  }
  newPosition.set(updatedVertices);
  mesh.geometry.setAttribute('position', newPosition);
  mesh.geometry.computeVertexNormals();
  mesh.geometry.normalsNeedUpdate = true;
  mesh.geometry.verticesNeedUpdate = true;
  mesh.rotation.y -= 0.005;
  mesh.rotation.x -= 0.01;
}

function animateSpikes() {
  gsap.fromTo(spikes, { height: 0.5 }, { height: 0.7, duration: 2.0, repeat: -1, yoyo: true });
}

function onWindowResize() {
  containerWidth = container.offsetWidth;
  containerHeight = window.innerHeight - highlights.offsetHeight;
  calculateEdge();
  camera.updateProjectionMatrix();
  renderer.setSize( edge, edge );
}

function render () {
  // stats.begin();

  renderer.render(scene, camera);
  uniforms.u_time.value = clock.getElapsedTime();
  updateBufferMesh();

  // stats.end();

  // Schedule the next frame.
  requestAnimationFrame(render);
}

export default function() {
  // Create Stats: 0 FPS, 1 MS, 2 MN
  // stats.showPanel( 0 );
  // Add stats panel to DOM
  // document.body.appendChild( stats.dom );
  // Schedule the first frame
  requestAnimationFrame( render );
  animateSpikes();
  // Add resize listener
  window.addEventListener( 'resize', onWindowResize, false );
}

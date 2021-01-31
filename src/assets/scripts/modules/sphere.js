import * as THREE from 'three';
import Stats from 'stats.js';
import noise from 'perlin.js';
import { vShader, fShader } from './shaders';

const container = document.querySelector('#js-sphere');
const highlights = document.querySelector('#js-highlights');
const stats = new Stats();
const clock = new THREE.Clock();

let edge;
let containerWidth = container.offsetWidth;
let containerHeight = window.innerHeight - highlights.offsetHeight;
let aspectRatio = 1;
let spikes = 1.1; // Higher for more spikes

function calculateEdge() {
  if (containerWidth >= containerHeight) {
    edge = containerHeight;
  } else {
    edge = containerWidth;
  }
}

const VIEW_ANGLE = 45;
const NEAR = 0.1;
const FAR = 1000;

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
  return scene;
}

function createRenderer() {
  calculateEdge();
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
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
  const lights = [];
  lights[0] = new THREE.PointLight( 0xffffff, 0.5, 0 );
  lights[0].position.set( 3, 1, 3 );

  scene.add( lights[0] );
  return lights;
}

function createMesh() {
  const material = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms,
    lights: true
  });
  const geometry = new THREE.SphereBufferGeometry(1, 200, 200);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

const position = mesh.geometry.getAttribute('position');
const count = position.count; // 4225
const length = position.array.length; // 12675
const vertices = position.array;
const updatedVertices = new Float32Array(length);
let v = new THREE.Vector3();
let x, y, z;

function updateBufferMesh() {
  let index = 0;
  for ( let i = 0, l = count; i < l; i++ ) {
    x = vertices[index++];
    y = vertices[index++];
    z = vertices[index++];
    v.x = x;
    v.y = y;
    v.z = z;
    v.normalize()
      .multiplyScalar(1 + 0.09 *
        noise.simplex3(v.x * spikes + (uniforms.u_time.value * 0.5), v.y * spikes, v.z * spikes));
    updatedVertices[index - 3] = v.x;
    updatedVertices[index - 2] = v.y;
    updatedVertices[index - 1] = v.z;
  }
  mesh.geometry.setAttribute('position', new THREE.BufferAttribute( updatedVertices, 3 ));
  mesh.geometry.computeVertexNormals();
  mesh.geometry.normalsNeedUpdate = true;
  mesh.geometry.verticesNeedUpdate = true;
  mesh.rotation.y += 0.001;
  mesh.rotation.x += 0.002;
}

let forward = true;
function animateSpikes() {
  if (forward) {
    if (spikes < 1.5) {
      spikes += 0.01;
    } else {
      forward = false;
    }
  }
  if (!forward) {
    if (spikes > -0.5) {
      spikes -= 0.01;
    } else {
      forward = true;
    }
  }
}

function onWindowResize() {
  containerWidth = container.offsetWidth;
  containerHeight = window.innerHeight - highlights.offsetHeight;
  // camera.aspect = width / height;
  calculateEdge();
  camera.updateProjectionMatrix();
  renderer.setSize( edge, edge );
}

function render () {
  stats.begin();

  renderer.render(scene, camera);
  // uniforms.u_time.value = clock.getElapsedTime();
  // animateSpikes();
  // updateBufferMesh();

  stats.end();

  // Schedule the next frame.
  requestAnimationFrame(render);
}

export default function() {
  // Create Stats: 0 FPS, 1 MS, 2 MN
  stats.showPanel( 1 );
  // Add stats panel to DOM
  document.body.appendChild( stats.dom );
  // Schedule the first frame
  requestAnimationFrame( render );
  // Temp for static version
  updateBufferMesh();
  // Add resize listener
  window.addEventListener( 'resize', onWindowResize, false );
}

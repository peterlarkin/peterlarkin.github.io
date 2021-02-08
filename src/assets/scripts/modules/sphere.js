import * as THREE from 'three';
import Stats from 'stats.js';
import noise from 'perlin.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { vShader, fShader } from './shaders';

gsap.registerPlugin(ScrollTrigger);

const VIEW_ANGLE = 40;
const NEAR = 0.1;
const FAR = 50;

const container = document.querySelector('#js-sphere');
const highlights = document.querySelector('#js-highlights');
const stats = new Stats();
const clock = new THREE.Clock();

let containerWidth = container.offsetWidth;
let containerHeight = container.offsetHeight;
let spikes = { height: 0.6 };
let inView = true;

const scene = createScene();
const renderer = createRenderer();
const camera = createCamera();
const lights = createLights();

const uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib[ "lights" ],
  THREE.UniformsLib[ "fog" ],
  {
    u_time: { value: 0.0 },
    // fogColor: { type: "c", value: scene.fog.color },
    // fogNear: { type: "f", value: scene.fog.near },
    // fogFar: { type: "f", value: scene.fog.far },
    color1: { type: "c", value: new THREE.Color(0xFFE78E) },
    color2: { type: "c", value: new THREE.Color(0xAADDD6) }
  }
]);

const sphere = createSphere();
// const cylinder = createCylinder();

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x004F48 );
  // scene.fog = new THREE.Fog(0x004F48, 0.1, 7);
  return scene;
}

function createRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.gammaFactor = 2.2;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(containerWidth, containerHeight);
  container.appendChild(renderer.domElement);
  return renderer;
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, containerWidth / containerHeight, NEAR, FAR);
  camera.position.z = 4;
  scene.add(camera);
  return camera;
}

function createLights() {
  const lights = [];
  lights[ 0 ] = new THREE.PointLight( 0xffffff, 0.4, 0 );
  lights[ 1 ] = new THREE.PointLight( 0xffffff, 0.4, 0 );
  lights[ 2 ] = new THREE.PointLight( 0xffffff, 0.4, 0 );

  lights[ 0 ].position.set( 0, 200, 0 );
  lights[ 1 ].position.set( 100, 200, 100 );
  lights[ 2 ].position.set( - 100, - 200, - 100 );

  scene.add( lights[ 0 ] );
  scene.add( lights[ 1 ] );
  scene.add( lights[ 2 ] );
  return lights;
}

function createSphere() {
  const material = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms,
    lights: true,
    // fog: true
  });
  const geometry = new THREE.SphereBufferGeometry( 1, 128, 128 );
  const sphere = new THREE.Mesh( geometry, material );
  scene.add( sphere );
  return sphere;
}

// function createCylinder() {
//   const geometry = new THREE.CylinderGeometry( 1, 1, 2, 32, 1, true );
//   const material = new THREE.MeshStandardMaterial({
//     color: 0xAADDD6,
//     emissive: 0x072534,
//     side: THREE.DoubleSide,
//     // metalness: 0,
//     // roughness: 0
//   });
//   const cylinder = new THREE.Mesh( geometry, material );
//   cylinder.position.y = 5;
//   // cylinder.rotation.x = 1.7;
//   scene.add( cylinder );
//   return cylinder;
// }

const position = sphere.geometry.getAttribute('position');
const count = position.count;
const length = position.array.length;
const vertices = position.array;
let updatedVertices = new Float32Array( length );
let newPosition = new THREE.BufferAttribute( updatedVertices, 3 );
let v = new THREE.Vector3();
let x, y, z;
let index;

function updateSphereGeometry() {
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
  sphere.geometry.setAttribute('position', newPosition);
  sphere.geometry.computeVertexNormals();
  sphere.geometry.normalsNeedUpdate = true;
  sphere.geometry.verticesNeedUpdate = true;
  sphere.rotation.y -= 0.005;
  sphere.rotation.x -= 0.01;
}

function spikeAnimation() {
  gsap.fromTo(spikes, {
    height: 0.5
  }, {
    height: 0.7,
    duration: 2.0,
    repeat: -1,
    yoyo: true
  });
}

function scrollAnimation() {
  gsap.timeline({
      scrollTrigger: {
        trigger: '.intro',
        start: 'top top',
        end: 'bottom 25%',
        scrub: true,
        onLeave: () => { inView = false; },
        onEnterBack: () => { inView = true; }
      }
    })
    .to('.intro__text h1', { opacity: 0, x: 20, duration: 0.1, ease: 'power2.in' })
    .to('.intro__text p', { opacity: 0, x: -20, duration: 0.1, ease: 'power2.in' }, '-=0.1')
    .addLabel('sphere')
    .to(sphere.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.5, ease: 'sine.InOut' }, 'sphere')
    .to(sphere.position, { y: 2.5, duration: 0.5, ease: 'sine.InOut' }, 'sphere')
    .to(sphere.rotation, { z: 3.14, duration: 0.5 }, 'sphere');
}

function render () {
  stats.begin();

  if (inView) {
    renderer.render(scene, camera);
    uniforms.u_time.value = clock.getElapsedTime();
    updateSphereGeometry();
  }

  stats.end();

  // Schedule the next frame.
  requestAnimationFrame(render);
}

function onWindowResize() {
  containerWidth = container.offsetWidth;
  containerHeight = container.offsetHeight;
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( containerWidth, containerHeight );
}

export default function() {
  // Create Stats: 0 FPS, 1 MS, 2 MN
  stats.showPanel( 0 );

  // Add stats panel to DOM
  document.body.appendChild( stats.dom );

  // Render canvas and then start render loop
  renderer.render(scene, camera);
  requestAnimationFrame( render );

  // Setup animations
  spikeAnimation();
  scrollAnimation();

  // Add resize listener
  window.addEventListener( 'resize', onWindowResize, false );
}

import {
  Clock,
  UniformsUtils,
  UniformsLib,
  Color,
  Scene,
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  PointLight,
  ShaderMaterial,
  SphereBufferGeometry,
  Mesh,
  BufferAttribute,
  Vector2,
  Vector3,
  Box3
} from 'three';
import noise from 'perlin.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { vShader, fShader } from './shaders';

gsap.registerPlugin(ScrollTrigger);

const fov = 40;
const near = 0.1;
const far = 50;
const spikes = { height: 0.6 };
const uniforms = UniformsUtils.merge([
  UniformsLib.lights,
  {
    u_time: { value: 0.0 },
    color1: { type: 'c', value: new Color(0xFFE78E) },
    color2: { type: 'c', value: new Color(0xAADDD6) }
  }
]);

// General
let clock;
let container;
let containerWidth;
let containerHeight;
let inView;
let cameraZoomNeedsUpdate;

// THREE scene
let scene;
let renderer;
let camera;
let sphere;

// For SphereBufferGeometry
let position;
let count;
let length;
let vertices;
let updatedVertices;
let newPosition;
let v;
let x;
let y;
let z;
let index;

function createScene () {
  const scene = new Scene();
  scene.background = new Color(0x004F48);
  return scene;
}

function createRenderer () {
  const renderer = new WebGLRenderer({
    antialias: true
  });
  renderer.outputEncoding = sRGBEncoding;
  renderer.setSize(containerWidth, containerHeight);
  container.appendChild(renderer.domElement);
  return renderer;
}

function createCamera () {
  const camera = new PerspectiveCamera(fov, containerWidth / containerHeight, near, far);
  scene.add(camera);
  return camera;
}

function createLights () {
  const lights = [];
  lights[0] = new PointLight(0xffffff, 0.4, 0);
  lights[1] = new PointLight(0xffffff, 0.4, 0);
  lights[2] = new PointLight(0xffffff, 0.4, 0);

  lights[0].position.set(0, 200, 0);
  lights[1].position.set(100, 200, 100);
  lights[2].position.set(-100, -200, -100);

  scene.add(lights[0]);
  scene.add(lights[1]);
  scene.add(lights[2]);
  return lights;
}

function createSphere () {
  const material = new ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms,
    lights: true
  });
  const geometry = new SphereBufferGeometry(1, 128, 128);
  const sphere = new Mesh(geometry, material);
  scene.add(sphere);
  return sphere;
}

function updateSphereGeometry () {
  index = 0;
  for (let i = 0, l = count; i < l; i++) {
    x = vertices[index++];
    y = vertices[index++];
    z = vertices[index++];
    v.set(x, y, z);
    v.normalize()
      .multiplyScalar(1.0 + 0.09 *
        noise.simplex3(
          v.x * spikes.height + (uniforms.u_time.value * 0.3),
          v.y * spikes.height,
          v.z * spikes.height
        ));
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

  if (cameraZoomNeedsUpdate) {
    fitCameraToObject(sphere);
    cameraZoomNeedsUpdate = false;
  }
}

function spikeAnimation () {
  gsap.fromTo(spikes, {
    height: 0.5
  }, {
    height: 0.7,
    duration: 2.0,
    repeat: -1,
    yoyo: true
  });
}

function scrollAnimation () {
  ScrollTrigger.matchMedia({
    '(min-width: 768px)': function () {
      gsap.timeline({
        scrollTrigger: {
          trigger: '.intro',
          start: 'top top',
          end: 'bottom 10%',
          scrub: true,
          onLeave: () => { inView = false; },
          onEnterBack: () => { inView = true; }
        }
      })
        .to('.intro__text h1', {
          opacity: 0, x: 20, duration: 0.2, ease: 'power2.in'
        })
        .to('.intro__text p', {
          opacity: 0, x: -20, duration: 0.2, ease: 'power2.in'
        }, '-=0.1')
        .addLabel('sphere', '-=0.1')
        .to(sphere.scale, {
          x: 0.5, y: 0.5, z: 0.5, duration: 0.8, ease: 'sine.InOut'
        }, 'sphere')
        .to(container, {
          y: '-10%',
          duration: 0.8,
          ease: 'sine.InOut'
        }, 'sphere')
        .to(sphere.rotation, { z: 3.14, duration: 0.8 }, 'sphere')
        .set(container, { visibility: 'hidden' });
    }
  });
}

function render () {
  if (inView) {
    renderer.render(scene, camera);
    uniforms.u_time.value = clock.getElapsedTime();
    updateSphereGeometry();
  }

  // Schedule the next frame.
  requestAnimationFrame(render);
}

export function onWindowResize () {
  containerWidth = container.offsetWidth;
  containerHeight = container.offsetHeight;
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);
  cameraZoomNeedsUpdate = true;
}

export function onWindowLoad () {
  // Render on window load to avoid weird glitch if page is not at top.
  renderer.render(scene, camera);
}

function fitCameraToObject (object) {
  let offset = 1;

  const boundingBox = new Box3();
  boundingBox.setFromObject(object);

  const rendererSize = new Vector2();
  renderer.getSize(rendererSize);

  // Check for portrait renderer aspect
  if (rendererSize.x < rendererSize.y) {
    // Progressively increase offset the more portrait the renderer is
    if (camera.aspect < 0.75) {
      offset = 1.5;
    }
    if (camera.aspect < 0.5) {
      offset = 2.5;
    }
  }

  // The maxDim is set with this number as it changes as the blob morphs
  // 3.3 is the maximum either the width or height becomes in the animation
  const maxDim = 3.3;
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

  // Zoom out a little so that objects don't fill the screen
  cameraZ *= offset;
  camera.position.z = cameraZ;

  const minZ = boundingBox.min.z;
  const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

  camera.far = cameraToFarEdge * 3;
  camera.updateProjectionMatrix();
};

export default function () {
  container = document.querySelector('#js-sphere');
  if (!container) {
    return;
  }

  // General
  clock = new Clock();
  containerWidth = container.offsetWidth;
  containerHeight = container.offsetHeight;
  inView = true;
  cameraZoomNeedsUpdate = true;

  // THREE scene
  scene = createScene();
  renderer = createRenderer();
  camera = createCamera();
  createLights();
  sphere = createSphere();

  // SphereBufferGeometry
  position = sphere.geometry.getAttribute('position');
  count = position.count;
  length = position.array.length;
  vertices = position.array;
  updatedVertices = new Float32Array(length);
  newPosition = new BufferAttribute(updatedVertices, 3);
  v = new Vector3();

  // Start render loop
  requestAnimationFrame(render);

  // Setup animations
  spikeAnimation();
  scrollAnimation();

  // Add resize listener
  window.addEventListener('resize', onWindowResize, false);
  // Add load listener
  window.addEventListener('load', onWindowLoad, false);
}

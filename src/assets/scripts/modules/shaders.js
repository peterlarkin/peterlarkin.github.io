export const vShader = `
  varying vec2 vUv;
  varying vec3 vecPos;
  varying vec3 vecNormal;

  void main() {
    vUv = uv;
    vecPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vecNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;
    gl_Position = projectionMatrix * vec4(vecPos, 1.0);
  }
`;

export const fShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float u_time;
  varying vec2 vUv;
  varying vec3 vecPos;
  varying vec3 vecNormal;

  struct PointLight {
    vec3 color;
    vec3 position;
  };

  uniform PointLight pointLights[NUM_POINT_LIGHTS];

  void main() {
    vec4 addedLights = vec4(0.6, 0.6, 0.6, 1.0);
    for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
        vec3 lightDirection = normalize(vecPos - pointLights[l].position);
        addedLights.rgb += clamp(dot(-lightDirection, vecNormal), 0.0, 1.0) * pointLights[l].color;
    }
    gl_FragColor = vec4(mix(color1, color2, (abs(sin(u_time / 2.0) * (vUv.y / 0.5))) - 0.25), 0.8) * addedLights;
  }
`;

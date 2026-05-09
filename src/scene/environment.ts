import * as THREE from 'three';
import type { AppSettings, MissionEnvironmentDefinition } from '../types/game';
import type { GraphicsProfile } from './renderer';

export interface MissionAtmosphereVisuals {
  skyDome: THREE.Mesh;
  horizonGroup: THREE.Group;
}

function createMissionAtmosphere(scene: THREE.Scene, environment: MissionEnvironmentDefinition, settings: AppSettings): MissionAtmosphereVisuals {
  const sky = environment.skyDepth;
  const skyDomeGeo = new THREE.SphereGeometry(900, 48, 24);
  const skyDomeMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(sky.topColor) },
      horizonColor: { value: new THREE.Color(sky.horizonColor) },
      bottomColor: { value: new THREE.Color(sky.bottomColor) },
      horizonIntensity: { value: sky.horizonIntensity },
    },
    vertexShader: `
      varying vec3 vSkyDirection;

      void main() {
        vSkyDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      uniform float horizonIntensity;
      varying vec3 vSkyDirection;

      void main() {
        float heightMix = clamp(vSkyDirection.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 lowerSky = mix(bottomColor, horizonColor, smoothstep(0.25, 0.58, heightMix));
        vec3 upperSky = mix(horizonColor, topColor, smoothstep(0.48, 1.0, heightMix));
        vec3 skyColor = mix(lowerSky, upperSky, smoothstep(0.42, 0.72, heightMix));
        float horizonGlow = pow(1.0 - abs(vSkyDirection.y), 5.0) * horizonIntensity;
        skyColor += horizonColor * horizonGlow * 0.22;
        gl_FragColor = vec4(skyColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
  skyDome.renderOrder = -100;
  scene.add(skyDome);

  const horizonGroup = new THREE.Group();
  const hazeOpacity = settings.reduceEffects ? sky.hazeOpacity * 0.5 : sky.hazeOpacity;
  const hazeMat = new THREE.MeshBasicMaterial({
    color: sky.hazeColor,
    transparent: true,
    opacity: hazeOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const hazeBand = new THREE.Mesh(new THREE.CylinderGeometry(860, 860, 260, 72, 1, true), hazeMat);
  hazeBand.position.y = 96;
  horizonGroup.add(hazeBand);

  const lowHazeMat = new THREE.MeshBasicMaterial({
    color: sky.horizonColor,
    transparent: true,
    opacity: hazeOpacity * 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const lowHazeBand = new THREE.Mesh(new THREE.CylinderGeometry(830, 830, 54, 72, 1, true), lowHazeMat);
  lowHazeBand.position.y = 18;
  horizonGroup.add(lowHazeBand);

  horizonGroup.renderOrder = -50;
  scene.add(horizonGroup);

  return { skyDome, horizonGroup };
}

export function updateMissionAtmosphere(atmosphere: MissionAtmosphereVisuals, camera: THREE.Camera) {
  atmosphere.skyDome.position.copy(camera.position);
  atmosphere.horizonGroup.position.set(camera.position.x, 0, camera.position.z);
}

export function createMissionLighting(scene: THREE.Scene, environment: MissionEnvironmentDefinition) {
  const ambientLight = new THREE.AmbientLight(environment.ambientLight.color, environment.ambientLight.intensity);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(environment.sunLight.color, environment.sunLight.intensity);
  sunLight.position.set(...environment.sunLight.position);
  scene.add(sunLight);

  return { ambientLight, sunLight };
}

export function createMissionEnvironment(
  scene: THREE.Scene,
  environment: MissionEnvironmentDefinition,
  graphicsProfile: GraphicsProfile,
  settings: AppSettings
) {
  const atmosphere = createMissionAtmosphere(scene, environment, settings);
  const grid = new THREE.GridHelper(
    environment.gridProfile.size,
    environment.gridProfile.divisions,
    environment.gridProfile.color,
    environment.gridProfile.color
  );
  grid.position.y = environment.gridProfile.y;
  (grid.material as THREE.LineBasicMaterial).opacity = environment.gridProfile.opacity;
  (grid.material as THREE.LineBasicMaterial).transparent = true;
  scene.add(grid);

  const floorGeometry = new THREE.PlaneGeometry(environment.gridProfile.size, environment.gridProfile.size);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: environment.floorMaterial.color,
    roughness: environment.floorMaterial.roughness,
    metalness: environment.floorMaterial.metalness,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.6;
  scene.add(floor);

  const envGroup = new THREE.Group();
  const structMat = new THREE.MeshStandardMaterial({
    color: environment.structureColor,
    roughness: 1,
    metalness: 0,
    fog: true,
  });

  const landmarkCount = Math.max(12, Math.round(environment.landmarkCount * graphicsProfile.effectScale));
  for (let i = 0; i < landmarkCount; i++) {
    const ridgeStyle = environment.landmarkStyle === 'ridges';
    const width = ridgeStyle ? 50 + Math.random() * 120 : 10 + Math.random() * 40;
    const depth = ridgeStyle ? 8 + Math.random() * 24 : 10 + Math.random() * 40;
    const height = ridgeStyle ? 12 + Math.random() * 28 : 10 + Math.random() * 60;
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, structMat);
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 430;

    mesh.position.set(Math.cos(angle) * dist, height / 2 - 1, Math.sin(angle) * dist);
    mesh.rotation.y = Math.random() * Math.PI;
    envGroup.add(mesh);
  }
  scene.add(envGroup);

  const boundaryGeo = new THREE.RingGeometry(environment.boundaryRadius, environment.boundaryRadius + 5, 64);
  const boundaryMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
  const boundaryMesh = new THREE.Mesh(boundaryGeo, boundaryMat);
  boundaryMesh.rotation.x = -Math.PI / 2;
  scene.add(boundaryMesh);

  const plateaus = Math.max(6, Math.round(environment.plateauCount * graphicsProfile.effectScale));
  const plateauGeo = new THREE.CylinderGeometry(50, 60, 40, 6);
  const plateauMat = new THREE.MeshStandardMaterial({ color: environment.plateauColor, roughness: 0.9 });

  for (let i = 0; i < plateaus; i++) {
    const plateau = new THREE.Mesh(plateauGeo, plateauMat);
    const radius = 300 + Math.random() * 800;
    const angle = Math.random() * Math.PI * 2;
    plateau.position.set(Math.cos(angle) * radius, 15, Math.sin(angle) * radius);
    plateau.rotation.y = Math.random() * Math.PI;
    scene.add(plateau);
  }

  environment.hazards.forEach(hazard => {
    const hazardGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(hazard.radius * 0.78, hazard.radius, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: hazard.color, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    hazardGroup.add(ring);

    if (!settings.reduceEffects) {
      const columnGeo = new THREE.CylinderGeometry(hazard.radius * 0.45, hazard.radius * 0.6, 900, 32, 1, true);
      const columnMat = new THREE.MeshBasicMaterial({ color: hazard.color, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false });
      const column = new THREE.Mesh(columnGeo, columnMat);
      column.position.y = 450;
      hazardGroup.add(column);
    }

    hazardGroup.position.set(...hazard.position);
    scene.add(hazardGroup);
  });

  return { grid, floor, envGroup, boundaryMesh, atmosphere };
}

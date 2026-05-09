import * as THREE from 'three';

export function calculateScreenPosition(
  targetPos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  edgeMargin: number = 40,
  wasOffScreen: boolean = false,
  prevAngle: number = 0
) {
  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);

  const toTargetLocal = targetPos.clone().sub(camera.position);
  const toTargetDist = toTargetLocal.length();
  const toTarget = toTargetDist > 0 ? toTargetLocal.divideScalar(toTargetDist) : new THREE.Vector3(0, 0, -1);

  const forwardAmount = cameraForward.dot(toTarget);
  const inFront = forwardAmount > 0;

  let projected = new THREE.Vector3();
  if (inFront) {
    projected = targetPos.clone().project(camera);
  }

  const thresholdX = wasOffScreen ? 0.85 : 0.95;
  const thresholdY = wasOffScreen ? 0.85 : 0.95;
  const offScreen = !inFront || Math.abs(projected.x) > thresholdX || Math.abs(projected.y) > thresholdY;

  const widthHalf = window.innerWidth / 2;
  const heightHalf = window.innerHeight / 2;

  let x = 0;
  let y = 0;
  let angle = 0;

  if (offScreen) {
    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    let dirX = toTarget.dot(cameraRight);
    let dirY = toTarget.dot(cameraUp);

    if (forwardAmount <= 0) {
      if (Math.abs(dirX) < 0.05 && Math.abs(dirY) < 0.05) {
        const prevDirX = Math.cos(prevAngle);
        dirX = prevDirX >= 0 ? 1 : -1;
        dirY = 0;
      }
    }

    const screenDirY = -dirY;

    if (Math.abs(dirX) < 0.001 && Math.abs(screenDirY) < 0.001) {
      dirX = 1;
    }

    angle = Math.atan2(screenDirY, dirX);

    const safeMarginX = 90;
    const safeMarginY = 110;
    const boxWHalf = widthHalf - safeMarginX;
    const boxHHalf = heightHalf - safeMarginY;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tX = Math.abs(cos) > 0.001 ? Math.abs(boxWHalf / cos) : Infinity;
    const tY = Math.abs(sin) > 0.001 ? Math.abs(boxHHalf / sin) : Infinity;
    const t = Math.min(tX, tY);

    x = widthHalf + cos * t;
    y = heightHalf + sin * t;
  } else {
    x = (projected.x * widthHalf) + widthHalf;
    y = -(projected.y * heightHalf) + heightHalf;
  }

  return { x, y, offScreen, angle };
}

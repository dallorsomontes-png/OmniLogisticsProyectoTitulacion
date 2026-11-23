
"use strict";

(() => {
  const cube = document.getElementById("hologramCube");
  const scene = document.getElementById("hologramScene");

  if (!cube || !scene) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let rotationX = -22;
  let rotationY = 30;
  let targetX = rotationX;
  let targetY = rotationY;
  let lastTime = 0;
  let frameId = null;

  function animate(time) {
    const delta = lastTime
      ? Math.min((time - lastTime) / 1000, 0.05)
      : 0;

    lastTime = time;

    targetY += delta * 17;

    rotationX += (targetX - rotationX) * 0.06;
    rotationY += (targetY - rotationY) * 0.06;

    cube.style.transform =
      `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

    frameId = requestAnimationFrame(animate);
  }

  scene.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;

    const rect = scene.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    targetX = -22 + (y - 0.5) * 35;
    targetY += (x - 0.5) * 2;
  });

  scene.addEventListener("pointerleave", () => {
    targetX = -22;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
      lastTime = 0;
    } else if (!document.hidden && !reduceMotion && frameId === null) {
      frameId = requestAnimationFrame(animate);
    }
  });

  if (reduceMotion) {
    cube.style.transform =
      `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
  } else {
    frameId = requestAnimationFrame(animate);
  }
})();

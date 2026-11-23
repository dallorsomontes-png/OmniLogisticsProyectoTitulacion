
"use strict";

/*
  OMNILOGISTICS PREMIUM
  Lluvia neón multicolor animada
*/

(() => {
  if (window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.id = "neonRain";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let lastTime = 0;
  let animationId = null;

  const particles = [];

  // Paleta de colores neón
  const colors = [
    [255, 36, 77],   // Rojo
    [25, 200, 255],  // Azul
    [168, 85, 247],  // Violeta
    [22, 230, 161],  // Verde
    [255, 176, 32]   // Dorado
  ];

  // Duración de cada transición: 4 segundos
  const colorDuration = 4000;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticle(anywhere = false) {
    return {
      x: random(0, width),
      y: anywhere
        ? random(0, height)
        : random(-120, -10),

      length: random(12, 38),
      speed: random(40, 110),
      thickness: random(0.6, 1.6),
      opacity: random(0.25, 0.85),
      drift: random(-9, 9)
    };
  }

  function resize() {
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(
      160,
      Math.max(
        30,
        Math.floor(width * height / 7500)
      )
    );

    particles.length = 0;

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(true));
    }
  }

  function getCurrentColor(time) {
    const position = time / colorDuration;

    const index = Math.floor(position) % colors.length;
    const nextIndex = (index + 1) % colors.length;

    const progress = position % 1;

    // Transición suave
    const smooth = progress * progress *
      (3 - 2 * progress);

    const current = colors[index];
    const next = colors[nextIndex];

    return current.map((value, i) =>
      Math.round(value + (next[i] - value) * smooth)
    );
  }

  function draw(delta, time) {
    ctx.clearRect(0, 0, width, height);

    const [r, g, b] = getCurrentColor(time);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.y += p.speed * delta;
      p.x += p.drift * delta;

      if (
        p.y > height + p.length ||
        p.x < -40 ||
        p.x > width + 40
      ) {
        particles[i] = createParticle();
        continue;
      }

      const gradient = ctx.createLinearGradient(
        p.x,
        p.y - p.length,
        p.x,
        p.y
      );

      gradient.addColorStop(
        0,
        `rgba(${r}, ${g}, ${b}, 0)`
      );

      gradient.addColorStop(
        0.65,
        `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.4})`
      );

      gradient.addColorStop(
        1,
        `rgba(${r}, ${g}, ${b}, ${p.opacity})`
      );

      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.length);
      ctx.lineTo(p.x, p.y);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = p.thickness;

      ctx.shadowBlur = 9;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;

      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  function animate(timestamp) {
    const delta = lastTime
      ? Math.min((timestamp - lastTime) / 1000, 0.05)
      : 0;

    lastTime = timestamp;

    draw(delta, timestamp);

    animationId = requestAnimationFrame(animate);
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
        animationId = null;
        lastTime = 0;
      } else if (animationId === null) {
        animationId = requestAnimationFrame(animate);
      }
    }
  );

  window.addEventListener("resize", resize);

  resize();
  animationId = requestAnimationFrame(animate);
})();

window.Confetti = (() => {
  function create(gameCard, canvas, colors) {
    const ctx = canvas.getContext("2d");

    function resize() {
      const r = gameCard.getBoundingClientRect();
      canvas.width = r.width * devicePixelRatio;
      canvas.height = r.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    window.addEventListener("resize", resize);
    resize();

    function launch(onComplete) {
      canvas.classList.add("on");
      resize();

      const W = gameCard.clientWidth;
      const H = gameCard.clientHeight;

      const pieces = Array.from({ length: 140 }, () => ({
        x: Math.random() * W,
        y: -20,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2.2 + Math.random() * 3.2,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        life: 0,
        max: 140 + Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      function tick() {
        ctx.clearRect(0, 0, W, H);

        for (const p of pieces) {
          p.life++;
          p.x += p.vx;
          p.y += p.vy;
          p.r += p.vr;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }

        if (pieces.every((p) => p.life > p.max || p.y > H + 60)) {
          ctx.clearRect(0, 0, W, H);
          canvas.classList.remove("on");

          if (typeof onComplete === "function") {
            onComplete();
          }
          return;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    return { launch, resize };
  }

  return { create };
})();

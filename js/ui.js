window.UI = (() => {
  function el(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element #${id}`);
    return node;
  }

  function buildTiles(answer, answerRowsEl) {
    const tiles = [];
    answerRowsEl.innerHTML = "";

    answer.split(" ").forEach(word => {
      const row = document.createElement("div");
      row.className = "tilesRow";

      [...word].forEach(() => {
        const tile = document.createElement("div");
        tile.className = "tile";
        const span = document.createElement("span");
        tile.appendChild(span);
        row.appendChild(tile);
        tiles.push({ tile, span });
      });

      answerRowsEl.appendChild(row);
    });

    return tiles;
  }

  function buildIndexMap(answer) {
    const indexMap = [];
    let t = 0;
    for (let i = 0; i < answer.length; i++) {
      if (answer[i] !== " ") indexMap[i] = t++;
    }
    return indexMap;
  }

  function makeRing(ringEl, radius) {
    const C = 2 * Math.PI * radius;
    ringEl.style.strokeDasharray = `${C}`;
    ringEl.style.strokeDashoffset = `${C}`;

    return {
      setProgress(p01) {
        const clamped = Math.max(0, Math.min(1, p01));
        ringEl.style.strokeDashoffset = `${C * (1 - clamped)}`;
      }
    };
  }

  return { el, buildTiles, buildIndexMap, makeRing };
})();

(() => {
  /** Increment by 1 on every shipped update (shown on step 1, top-right). */
  const APP_VERSION = 2;

  const COLORS = {
    U: "c-white",
    D: "c-yellow",
    F: "c-green",
    B: "c-blue",
    L: "c-orange",
    R: "c-red",
  };

  const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];
  const CUBIE = 84;
  const HALF = CUBIE / 2;
  const TURN_MS = 420;
  const TURN_MS_180 = 560;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type {Record<string, string[]>} */
  let faces;

  const ALG1 = ["F", "R'", "F", "L2", "F'", "R", "F", "L2", "F2"];
  const ALG2 = ["R'", "U'", "R", "U'", "R'", "U2", "R"];

  const CUBIES = [
    { x: -1, y: 1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: -1, y: 1, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: 1, y: -1, z: 1 },
  ];

  const steps = [
    {
      id: "intro",
      title: "兩個公式，解完 2×2",
      body: `依循 David Guo「二階簡易解法」。一次只看一步——對齊畫面中的拿法，再動手。`,
      hold: "準備好實體方塊",
      hint: "",
      showAlg: null,
      cases: null,
      preset: "solved",
    },
    {
      id: "notation",
      title: "先認得轉法符號",
      body: `<strong>R / R'</strong> 右面順／逆 · <strong>U / U'</strong> 上面 · <strong>F / F'</strong> 前面 · <strong>L</strong> 左面。加 <strong>2</strong> 表示轉半圈。原站編號：1=R' 2=U' 3=F' 4=R 5=U 6=F 7=L。`,
      hold: "白面朝上 · 綠面朝自己",
      hint: "U",
      showAlg: "both",
      cases: null,
      preset: "solved",
    },
    {
      id: "step1",
      title: "第一步：一面轉好",
      body: `把<strong>白色面</strong>四個角拼齊。這步偏直覺。完成時，四個白貼紙都朝上。`,
      hold: "白面朝上",
      hint: "U",
      showAlg: null,
      cases: null,
      preset: "white-up",
    },
    {
      id: "step2",
      title: "第二步：白色側面調好",
      body: `看白層側面有無<strong>同色成對</strong>。放到<strong>左手邊</strong>，轉公式 1。若沒有成對，先轉一次公式 1。`,
      hold: "同色對 · 放左手邊",
      hint: "L",
      showAlg: "alg1",
      cases: null,
      preset: "white-layer",
    },
    {
      id: "step3",
      title: "第三步：黃色面轉好",
      body: `翻轉讓<strong>白面朝下</strong>。數上面黃貼紙數，選情況後轉公式 2（有時兩次，或先變成「1 黃」再處理）。`,
      hold: "白面朝下 · 選黃面情況",
      hint: "D",
      showAlg: "alg2",
      cases: ["1", "2", "0"],
      preset: "yellow-work",
    },
    {
      id: "step4",
      title: "第四步：黃色側面調好",
      body: `同第二步：黃層側面同色對放<strong>左手邊</strong>，轉公式 1。沒有成對就先轉一次。最後只轉上層對齊。`,
      hold: "同色對 · 左手邊 · 再對齊上層",
      hint: "L",
      showAlg: "alg1",
      cases: null,
      preset: "almost",
    },
    {
      id: "done",
      title: "完成",
      body: `兩個公式就能解完。熟練後可接原站的 3×3 簡易解法——符號與流程相通。`,
      hold: "六面完成",
      hint: "",
      showAlg: null,
      cases: null,
      preset: "solved",
    },
  ];

  let stepIndex = 0;
  let caseId = "1";
  let playing = false;
  let animating = false;
  let playCursor = -1;
  let activeAlg = [];
  /** @type {HTMLElement[]} */
  let cubieNodes = [];

  const els = {
    railFill: document.getElementById("rail-fill"),
    stepCount: document.getElementById("step-count"),
    appVersion: document.getElementById("app-version"),
    stepPanel: document.getElementById("step-panel"),
    stepTitle: document.getElementById("step-title"),
    stepBody: document.getElementById("step-body"),
    hold: document.getElementById("hold"),
    cases: document.getElementById("cases"),
    algBlock: document.getElementById("alg-block"),
    algLabel: document.getElementById("alg-label"),
    moves: document.getElementById("moves"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    btnPlay: document.getElementById("btn-play"),
    btnStep: document.getElementById("btn-step"),
    btnReset: document.getElementById("btn-reset"),
    cube: document.getElementById("cube"),
    cubeOrbit: document.getElementById("cube-orbit"),
  };

  function solvedFaces() {
    return {
      U: ["U", "U", "U", "U"],
      D: ["D", "D", "D", "D"],
      F: ["F", "F", "F", "F"],
      B: ["B", "B", "B", "B"],
      L: ["L", "L", "L", "L"],
      R: ["R", "R", "R", "R"],
    };
  }

  /**
   * Rotate a facelet quad as viewed on that face.
   * F/B index layout matches this CW sense; U/D/L/R use the inverse
   * (see faceletColor indexing vs outward view).
   */
  function rotateFaceCW(face, times) {
    const t = ((times % 4) + 4) % 4;
    let f = face;
    for (let i = 0; i < t; i += 1) {
      f = [f[2], f[0], f[3], f[1]];
    }
    return f;
  }

  function rotateFaceCCW(face, times) {
    return rotateFaceCW(face, (4 - (((times % 4) + 4) % 4)) % 4);
  }

  /** @deprecated alias used by flipWhiteDown */
  function rotateFace(face, times) {
    return rotateFaceCW(face, times);
  }

  // Facelet movers matched to CSS layer end poses (translate3d x,-y,z).
  // U family: keep turnDegrees; invert facelets so U' snap matches the
  // rotateY(+90) end pose (was snapping to U).

  function moveU(times = 1) {
    faces.U = rotateFaceCW(faces.U, times);
    for (let n = 0; n < times; n += 1) {
      const tmp = [faces.F[0], faces.F[1]];
      faces.F[0] = faces.R[0];
      faces.F[1] = faces.R[1];
      faces.R[0] = faces.B[0];
      faces.R[1] = faces.B[1];
      faces.B[0] = faces.L[0];
      faces.B[1] = faces.L[1];
      faces.L[0] = tmp[0];
      faces.L[1] = tmp[1];
    }
  }

  function moveD(times = 1) {
    faces.D = rotateFaceCCW(faces.D, times);
    for (let n = 0; n < times; n += 1) {
      const tmp = [faces.F[2], faces.F[3]];
      faces.F[2] = faces.R[2];
      faces.F[3] = faces.R[3];
      faces.R[2] = faces.B[2];
      faces.R[3] = faces.B[3];
      faces.B[2] = faces.L[2];
      faces.B[3] = faces.L[3];
      faces.L[2] = tmp[0];
      faces.L[3] = tmp[1];
    }
  }

  function moveF(times = 1) {
    faces.F = rotateFaceCW(faces.F, times);
    for (let n = 0; n < times; n += 1) {
      const u2 = faces.U[2];
      const u3 = faces.U[3];
      faces.U[2] = faces.L[3];
      faces.U[3] = faces.L[1];
      faces.L[1] = faces.D[0];
      faces.L[3] = faces.D[1];
      faces.D[0] = faces.R[2];
      faces.D[1] = faces.R[0];
      faces.R[0] = u2;
      faces.R[2] = u3;
    }
  }

  function moveB(times = 1) {
    faces.B = rotateFaceCW(faces.B, times);
    for (let n = 0; n < times; n += 1) {
      const u0 = faces.U[0];
      const u1 = faces.U[1];
      faces.U[0] = faces.R[1];
      faces.U[1] = faces.R[3];
      faces.R[1] = faces.D[3];
      faces.R[3] = faces.D[2];
      faces.D[2] = faces.L[0];
      faces.D[3] = faces.L[2];
      faces.L[0] = u1;
      faces.L[2] = u0;
    }
  }

  function moveL(times = 1) {
    faces.L = rotateFaceCCW(faces.L, times);
    for (let n = 0; n < times; n += 1) {
      const u0 = faces.U[0];
      const u2 = faces.U[2];
      const f0 = faces.F[0];
      const f2 = faces.F[2];
      const d0 = faces.D[0];
      const d2 = faces.D[2];
      const b1 = faces.B[1];
      const b3 = faces.B[3];
      // Left-layer sides only: DFL/DBL (D0/D2), not DFR/DBR.
      faces.U[0] = f0;
      faces.U[2] = f2;
      faces.F[0] = d0;
      faces.F[2] = d2;
      faces.D[0] = b3;
      faces.D[2] = b1;
      faces.B[1] = u2;
      faces.B[3] = u0;
    }
  }

  function moveR(times = 1) {
    // Inverted vs prior WCA-CW sense per user: token R' must spin the other way;
    // R / R' / R2 stay mutual inverses with matching CSS degrees.
    faces.R = rotateFaceCW(faces.R, times);
    for (let n = 0; n < times; n += 1) {
      const u1 = faces.U[1];
      const u3 = faces.U[3];
      const f1 = faces.F[1];
      const f3 = faces.F[3];
      const d1 = faces.D[1];
      const d3 = faces.D[3];
      const b0 = faces.B[0];
      const b2 = faces.B[2];
      faces.U[1] = f1;
      faces.U[3] = f3;
      faces.F[1] = d1;
      faces.F[3] = d3;
      faces.D[1] = b2;
      faces.D[3] = b0;
      faces.B[0] = u3;
      faces.B[2] = u1;
    }
  }

  const movers = { U: moveU, D: moveD, F: moveF, B: moveB, L: moveL, R: moveR };

  function parseToken(token) {
    const face = token[0];
    const suffix = token.slice(1);
    let quarterTurns = 1;
    if (suffix === "2") quarterTurns = 2;
    if (suffix === "'") quarterTurns = 3;
    return { face, quarterTurns, suffix };
  }

  function applyMove(token) {
    const { face, quarterTurns } = parseToken(token);
    movers[face](quarterTurns);
  }

  function flipWhiteDown() {
    const tmp = faces.U;
    faces.U = faces.D;
    faces.D = tmp;
    faces.F = rotateFace(faces.F, 2);
    faces.B = rotateFace(faces.B, 2);
    const left = faces.L;
    faces.L = rotateFace(faces.R, 2);
    faces.R = rotateFace(left, 2);
  }

  function faceletColor(face, x, y, z) {
    if (face === "U" && y === 1) {
      return faces.U[(z === 1 ? 2 : 0) + (x === 1 ? 1 : 0)];
    }
    if (face === "D" && y === -1) {
      return faces.D[(z === -1 ? 2 : 0) + (x === 1 ? 1 : 0)];
    }
    if (face === "F" && z === 1) {
      return faces.F[(y === -1 ? 2 : 0) + (x === 1 ? 1 : 0)];
    }
    if (face === "B" && z === -1) {
      return faces.B[(y === -1 ? 2 : 0) + (x === -1 ? 1 : 0)];
    }
    if (face === "L" && x === -1) {
      return faces.L[(y === -1 ? 2 : 0) + (z === 1 ? 1 : 0)];
    }
    if (face === "R" && x === 1) {
      return faces.R[(y === -1 ? 2 : 0) + (z === -1 ? 1 : 0)];
    }
    return null;
  }

  function cubieTranslate(x, y, z) {
    return `translate3d(${x * HALF}px, ${-y * HALF}px, ${z * HALF}px)`;
  }

  function paintCubie(node, x, y, z) {
    FACE_ORDER.forEach((face) => {
      const sticker = node.querySelector(`[data-face="${face}"]`);
      if (!sticker) return;
      const color = faceletColor(face, x, y, z);
      if (!color) {
        sticker.hidden = true;
        return;
      }
      sticker.hidden = false;
      sticker.className = `sticker face-${face.toLowerCase()} ${COLORS[color]}`;
    });
  }

  function resetCubieTransforms() {
    cubieNodes.forEach((node, i) => {
      const { x, y, z } = CUBIES[i];
      node.style.transition = "none";
      node.style.transform = cubieTranslate(x, y, z);
    });
    void els.cube.offsetWidth;
  }

  function renderCube() {
    cubieNodes.forEach((node, i) => {
      const { x, y, z } = CUBIES[i];
      paintCubie(node, x, y, z);
      node.style.transform = cubieTranslate(x, y, z);
    });
  }

  function layerPredicate(face) {
    if (face === "R") return (c) => c.x === 1;
    if (face === "L") return (c) => c.x === -1;
    if (face === "U") return (c) => c.y === 1;
    if (face === "D") return (c) => c.y === -1;
    if (face === "F") return (c) => c.z === 1;
    if (face === "B") return (c) => c.z === -1;
    return () => false;
  }

  /**
   * CSS degrees for one CW token (matched to applyMove / facelets).
   * Cubies use translate3d(x, -y, z): every CSS rotate*(θ) ≡ model rotate*(-θ).
   * R family uses the inverted sense vs classic WCA-CW so token R' matches
   * the user-facing direction fix; R / R' / R2 stay opposites with continuity.
   */
  function turnDegrees(face, quarterTurns) {
    const cw = {
      U: -90,
      D: 90,
      R: 90,
      L: 90,
      F: 90,
      B: -90,
    }[face];
    if (quarterTurns === 2) return cw * 2;
    if (quarterTurns === 3) return -cw;
    return cw;
  }

  function axisRotate(face, deg) {
    if (face === "U" || face === "D") return `rotateY(${deg}deg)`;
    if (face === "R" || face === "L") return `rotateX(${deg}deg)`;
    return `rotateZ(${deg}deg)`;
  }

  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function nextFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  async function animateToken(token) {
    const { face, quarterTurns } = parseToken(token);

    if (reducedMotion) {
      applyMove(token);
      renderCube();
      return;
    }

    // Paint pre-move state, then spin the layer, then commit facelets.
    renderCube();
    const deg = turnDegrees(face, quarterTurns);
    const ms = quarterTurns === 2 ? TURN_MS_180 : TURN_MS;
    const pred = layerPredicate(face);
    const moversIdx = [];

    cubieNodes.forEach((node, i) => {
      const c = CUBIES[i];
      node.classList.remove("is-turning");
      node.style.transition = "none";
      node.style.transform = cubieTranslate(c.x, c.y, c.z);
      if (pred(c)) moversIdx.push(i);
    });
    await nextFrame();

    els.cubeOrbit.classList.add("turning");
    moversIdx.forEach((i) => {
      const c = CUBIES[i];
      const node = cubieNodes[i];
      node.classList.add("is-turning");
      node.style.transition = `transform ${ms}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
      node.style.transform = `${axisRotate(face, deg)} ${cubieTranslate(c.x, c.y, c.z)}`;
    });

    await wait(ms + 30);
    applyMove(token);
    els.cubeOrbit.classList.remove("turning");
    cubieNodes.forEach((node) => node.classList.remove("is-turning"));
    resetCubieTransforms();
    renderCube();
  }

  function stopPlay() {
    playing = false;
    els.btnPlay.textContent = "播放";
  }

  function setPreset(name) {
    faces = solvedFaces();
    if (name === "yellow-work") {
      flipWhiteDown();
      if (caseId === "1") {
        faces.U[0] = "F";
        faces.F[0] = "U";
        faces.U[1] = "R";
        faces.R[0] = "U";
        faces.U[3] = "L";
        faces.L[1] = "U";
      } else if (caseId === "2") {
        faces.U[1] = "R";
        faces.R[0] = "U";
        faces.U[3] = "F";
        faces.F[1] = "U";
      } else if (caseId === "0") {
        faces.U[0] = "B";
        faces.B[1] = "U";
        faces.U[1] = "R";
        faces.R[0] = "U";
        faces.U[2] = "L";
        faces.L[1] = "U";
        faces.U[3] = "F";
        faces.F[1] = "U";
      }
    } else if (name === "almost") {
      flipWhiteDown();
      moveU(1);
    }
    resetCubieTransforms();
    renderCube();
  }

  function renderMoves(tokens) {
    els.moves.innerHTML = "";
    tokens.forEach((token, i) => {
      const span = document.createElement("span");
      span.className = "move";
      span.textContent = token;
      span.dataset.index = String(i);
      els.moves.appendChild(span);
    });
  }

  function paintMoveHighlight() {
    [...els.moves.children].forEach((node, i) => {
      node.classList.toggle("current", i === playCursor);
      node.classList.toggle("done", playCursor > i);
    });
  }

  function loadAlgForStep() {
    const step = steps[stepIndex];
    stopPlay();
    playCursor = -1;

    if (!step.showAlg) {
      els.algBlock.hidden = true;
      activeAlg = [];
      els.btnPlay.disabled = true;
      els.btnStep.disabled = true;
      return;
    }

    els.algBlock.hidden = false;
    if (step.showAlg === "alg1") {
      activeAlg = [...ALG1];
      els.algLabel.textContent = "公式 1 · F R' F L2 F' R F L2 F2";
    } else if (step.showAlg === "alg2") {
      activeAlg = [...ALG2];
      els.algLabel.textContent = "公式 2 · R' U' R U' R' U2 R";
    } else {
      activeAlg = [...ALG1];
      els.algLabel.textContent = "公式 1（點此切換公式 2）";
    }
    renderMoves(activeAlg);
    paintMoveHighlight();
    els.btnPlay.disabled = false;
    els.btnStep.disabled = false;
  }

  function renderCases() {
    const step = steps[stepIndex];
    els.cases.innerHTML = "";
    if (!step.cases) {
      els.cases.hidden = true;
      return;
    }
    els.cases.hidden = false;
    const labels = { "1": "1 黃", "2": "2 黃", "0": "0 黃" };
    step.cases.forEach((id) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = labels[id];
      btn.classList.toggle("active", caseId === id);
      btn.addEventListener("click", () => {
        caseId = id;
        renderCases();
        setPreset(step.preset);
        loadAlgForStep();
      });
      els.cases.appendChild(btn);
    });
  }

  function animateStepPanel() {
    els.stepPanel.classList.remove("enter");
    void els.stepPanel.offsetWidth;
    els.stepPanel.classList.add("enter");
  }

  function renderProgress() {
    const pct = ((stepIndex + 1) / steps.length) * 100;
    els.railFill.style.width = `${pct}%`;
    els.stepCount.textContent = `${stepIndex + 1} / ${steps.length}`;
    if (els.appVersion) {
      els.appVersion.textContent = `v${APP_VERSION}`;
      els.appVersion.hidden = stepIndex !== 0;
    }
  }

  function setControlsBusy(busy) {
    els.btnStep.disabled = busy || !activeAlg.length;
    els.btnPlay.disabled = busy || !activeAlg.length;
    els.btnReset.disabled = busy;
    els.btnPrev.disabled = busy || stepIndex === 0;
    els.btnNext.disabled = busy || stepIndex === steps.length - 1;
  }

  function renderStep() {
    const step = steps[stepIndex];
    els.stepTitle.textContent = step.title;
    els.stepBody.innerHTML = step.body;
    els.hold.textContent = step.hold;
    els.cubeOrbit.dataset.hint = step.hint || "";
    els.btnNext.textContent =
      stepIndex === steps.length - 1 ? "完成" : "下一步";
    renderProgress();
    renderCases();
    setPreset(step.preset);
    loadAlgForStep();
    setControlsBusy(false);
    animateStepPanel();
  }

  function goTo(index) {
    if (animating) return;
    stopPlay();
    stepIndex = Math.max(0, Math.min(steps.length - 1, index));
    renderStep();
  }

  async function stepOnce() {
    if (animating || !activeAlg.length) return;
    if (playCursor >= activeAlg.length - 1) {
      playCursor = -1;
      setPreset(steps[stepIndex].preset);
      paintMoveHighlight();
      return;
    }
    if (playCursor === -1) {
      setPreset(steps[stepIndex].preset);
    }
    playCursor += 1;
    paintMoveHighlight();
    animating = true;
    setControlsBusy(true);
    els.btnPlay.disabled = false;
    try {
      await animateToken(activeAlg[playCursor]);
    } finally {
      animating = false;
      if (!playing) setControlsBusy(false);
    }
  }

  async function playAlg() {
    if (!activeAlg.length || animating) return;
    if (playing) {
      stopPlay();
      setControlsBusy(false);
      return;
    }
    if (playCursor >= activeAlg.length - 1 || playCursor === -1) {
      playCursor = -1;
      setPreset(steps[stepIndex].preset);
      paintMoveHighlight();
    }
    playing = true;
    els.btnPlay.textContent = "暫停";
    setControlsBusy(true);
    els.btnPlay.disabled = false;

    while (playing && playCursor < activeAlg.length - 1) {
      await stepOnce();
      if (!playing) break;
      await wait(90);
    }
    stopPlay();
    setControlsBusy(false);
  }

  function buildCubeDom() {
    els.cube.innerHTML = "";
    cubieNodes = CUBIES.map(({ x, y, z }, index) => {
      const cubie = document.createElement("div");
      cubie.className = "cubie";
      cubie.dataset.index = String(index);
      cubie.style.transform = cubieTranslate(x, y, z);
      FACE_ORDER.forEach((face) => {
        const sticker = document.createElement("div");
        sticker.className = `sticker face-${face.toLowerCase()}`;
        sticker.dataset.face = face;
        cubie.appendChild(sticker);
      });
      els.cube.appendChild(cubie);
      return cubie;
    });
  }

  els.btnPrev.addEventListener("click", () => goTo(stepIndex - 1));
  els.btnNext.addEventListener("click", () => goTo(stepIndex + 1));
  els.btnPlay.addEventListener("click", () => {
    playAlg();
  });
  els.btnStep.addEventListener("click", () => {
    stopPlay();
    stepOnce();
  });
  els.btnReset.addEventListener("click", () => {
    if (animating) return;
    stopPlay();
    playCursor = -1;
    setPreset(steps[stepIndex].preset);
    paintMoveHighlight();
    setControlsBusy(false);
  });

  els.algLabel.addEventListener("click", () => {
    const step = steps[stepIndex];
    if (step.showAlg !== "both" || animating) return;
    if (activeAlg[0] === "F") {
      activeAlg = [...ALG2];
      els.algLabel.textContent = "公式 2（點此切換公式 1）";
    } else {
      activeAlg = [...ALG1];
      els.algLabel.textContent = "公式 1（點此切換公式 2）";
    }
    stopPlay();
    playCursor = -1;
    renderMoves(activeAlg);
    paintMoveHighlight();
  });

  buildCubeDom();
  faces = solvedFaces();
  renderStep();
})();

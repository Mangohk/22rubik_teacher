(() => {
  const COLORS = {
    U: "c-white",
    D: "c-yellow",
    F: "c-green",
    B: "c-blue",
    L: "c-orange",
    R: "c-red",
  };

  const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];

  /** @type {Record<string, string[]>} */
  let faces;

  const ALG1 = ["F", "R'", "F", "L2", "F'", "R", "F", "L2", "F2"];
  const ALG2 = ["R'", "U'", "R", "U'", "R'", "U2", "R"];

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
  let playTimer = null;
  let playCursor = -1;
  let activeAlg = [];

  const els = {
    railFill: document.getElementById("rail-fill"),
    stepCount: document.getElementById("step-count"),
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

  function rotateFace(face, times) {
    const t = ((times % 4) + 4) % 4;
    let f = face;
    for (let i = 0; i < t; i += 1) {
      f = [f[2], f[0], f[3], f[1]];
    }
    return f;
  }

  function moveU(times = 1) {
    faces.U = rotateFace(faces.U, times);
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
    faces.D = rotateFace(faces.D, times);
    for (let n = 0; n < times; n += 1) {
      const tmp = [faces.F[2], faces.F[3]];
      faces.F[2] = faces.L[2];
      faces.F[3] = faces.L[3];
      faces.L[2] = faces.B[2];
      faces.L[3] = faces.B[3];
      faces.B[2] = faces.R[2];
      faces.B[3] = faces.R[3];
      faces.R[2] = tmp[0];
      faces.R[3] = tmp[1];
    }
  }

  function moveF(times = 1) {
    faces.F = rotateFace(faces.F, times);
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
    faces.B = rotateFace(faces.B, times);
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
    faces.L = rotateFace(faces.L, times);
    for (let n = 0; n < times; n += 1) {
      const u0 = faces.U[0];
      const u2 = faces.U[2];
      faces.U[0] = faces.B[3];
      faces.U[2] = faces.B[1];
      faces.B[1] = faces.D[3];
      faces.B[3] = faces.D[1];
      faces.D[1] = faces.F[0];
      faces.D[3] = faces.F[2];
      faces.F[0] = u0;
      faces.F[2] = u2;
    }
  }

  function moveR(times = 1) {
    faces.R = rotateFace(faces.R, times);
    for (let n = 0; n < times; n += 1) {
      const u1 = faces.U[1];
      const u3 = faces.U[3];
      faces.U[1] = faces.F[1];
      faces.U[3] = faces.F[3];
      faces.F[1] = faces.D[1];
      faces.F[3] = faces.D[3];
      faces.D[1] = faces.B[2];
      faces.D[3] = faces.B[0];
      faces.B[0] = u3;
      faces.B[2] = u1;
    }
  }

  const movers = { U: moveU, D: moveD, F: moveF, B: moveB, L: moveL, R: moveR };

  function applyMove(token) {
    const face = token[0];
    const suffix = token.slice(1);
    let times = 1;
    if (suffix === "2") times = 2;
    if (suffix === "'") times = 3;
    movers[face](times);
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

  function renderCube() {
    FACE_ORDER.forEach((face) => {
      const nodes = els.cube.querySelectorAll(`[data-face="${face}"] .sticker`);
      faces[face].forEach((colorKey, i) => {
        nodes[i].className = `sticker ${COLORS[colorKey]}`;
      });
    });
  }

  function stopPlay() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
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
    els.btnPlay.textContent = "播放";

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
  }

  function renderStep() {
    const step = steps[stepIndex];
    els.stepTitle.textContent = step.title;
    els.stepBody.innerHTML = step.body;
    els.hold.textContent = step.hold;
    els.cubeOrbit.dataset.hint = step.hint || "";
    els.btnPrev.disabled = stepIndex === 0;
    els.btnNext.disabled = stepIndex === steps.length - 1;
    els.btnNext.textContent =
      stepIndex === steps.length - 1 ? "完成" : "下一步";
    renderProgress();
    renderCases();
    setPreset(step.preset);
    loadAlgForStep();
    animateStepPanel();
  }

  function goTo(index) {
    stepIndex = Math.max(0, Math.min(steps.length - 1, index));
    renderStep();
  }

  function pulseCube() {
    els.cube.classList.remove("pulse");
    void els.cube.offsetWidth;
    els.cube.classList.add("pulse");
  }

  function stepOnce() {
    if (!activeAlg.length) return;
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
    applyMove(activeAlg[playCursor]);
    renderCube();
    paintMoveHighlight();
    pulseCube();
  }

  function playAlg() {
    if (!activeAlg.length) return;
    if (playTimer) {
      stopPlay();
      els.btnPlay.textContent = "播放";
      return;
    }
    if (playCursor >= activeAlg.length - 1 || playCursor === -1) {
      playCursor = -1;
      setPreset(steps[stepIndex].preset);
      paintMoveHighlight();
    }
    els.btnPlay.textContent = "暫停";
    playTimer = setInterval(() => {
      if (playCursor >= activeAlg.length - 1) {
        stopPlay();
        els.btnPlay.textContent = "播放";
        return;
      }
      stepOnce();
    }, 650);
  }

  function buildCubeDom() {
    els.cube.innerHTML = "";
    FACE_ORDER.forEach((face) => {
      const faceEl = document.createElement("div");
      faceEl.className = `face face-${face.toLowerCase()}`;
      faceEl.dataset.face = face;
      for (let i = 0; i < 4; i += 1) {
        const sticker = document.createElement("div");
        sticker.className = "sticker";
        faceEl.appendChild(sticker);
      }
      els.cube.appendChild(faceEl);
    });
  }

  els.btnPrev.addEventListener("click", () => goTo(stepIndex - 1));
  els.btnNext.addEventListener("click", () => goTo(stepIndex + 1));
  els.btnPlay.addEventListener("click", playAlg);
  els.btnStep.addEventListener("click", () => {
    stopPlay();
    els.btnPlay.textContent = "播放";
    stepOnce();
  });
  els.btnReset.addEventListener("click", () => {
    stopPlay();
    els.btnPlay.textContent = "播放";
    playCursor = -1;
    setPreset(steps[stepIndex].preset);
    paintMoveHighlight();
  });

  els.algLabel.addEventListener("click", () => {
    const step = steps[stepIndex];
    if (step.showAlg !== "both") return;
    if (activeAlg[0] === "F") {
      activeAlg = [...ALG2];
      els.algLabel.textContent = "公式 2（點此切換公式 1）";
    } else {
      activeAlg = [...ALG1];
      els.algLabel.textContent = "公式 1（點此切換公式 2）";
    }
    stopPlay();
    playCursor = -1;
    els.btnPlay.textContent = "播放";
    renderMoves(activeAlg);
    paintMoveHighlight();
  });

  buildCubeDom();
  faces = solvedFaces();
  renderStep();
})();

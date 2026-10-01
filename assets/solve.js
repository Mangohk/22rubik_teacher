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
      short: "導覽",
      title: "2×2 初學者解法",
      body: `依循 David Guo「二階簡易解法」：只要記住 <strong>兩個公式</strong>。操作方式參考知名解法站（如 Grubiks 的 Back/Next、Ruwix 的逐步公式顯示）——一次只看一步，照畫面拿著方塊操作。`,
      hold: "先熟悉下面的轉法符號（WCA：F R U L）",
      showAlg: null,
      cases: null,
      preset: "solved",
    },
    {
      id: "notation",
      short: "符號",
      title: "轉法符號（對應原站 1–7）",
      body: `<strong>R / R'</strong> 右面順／逆時針 · <strong>U / U'</strong> 上面 · <strong>F / F'</strong> 前面 · <strong>L / L'</strong> 左面。數字 2 表示轉 180°（例如 U2、L2、F2）。原站編號：1=R' 2=U' 3=F' 4=R 5=U 6=F 7=L。`,
      hold: "方塊白面朝上、綠面朝自己時開始練習公式",
      showAlg: "both",
      cases: null,
      preset: "solved",
    },
    {
      id: "step1",
      short: "步驟1",
      title: "第一步：一面轉好（白面）",
      body: `先把<strong>白色面</strong>四個角拼齊。這一步偏直覺，可先自己試。完成時四個白貼紙都朝上。`,
      hold: "白面朝上，完成第一層的白色",
      showAlg: null,
      cases: null,
      preset: "white-up",
    },
    {
      id: "step2",
      short: "步驟2",
      title: "第二步：白色側面調好",
      body: `看白色層的<strong>側面</strong>有沒有相同顏色成對。把那一對放到<strong>左手邊</strong>（左面），白面朝上，然後轉<strong>公式 1</strong>。若完全沒有相同色對，先轉一次公式 1，就會出現一對。`,
      hold: "相同色對放在左手邊，白面朝上",
      showAlg: "alg1",
      cases: null,
      preset: "white-layer",
    },
    {
      id: "step3",
      short: "步驟3",
      title: "第三步：黃色面轉好",
      body: `把方塊翻轉，讓<strong>白面朝下</strong>。數上面有幾個黃貼紙朝上，選對應情況，擺好後轉<strong>公式 2</strong>（有時要轉兩次，或先轉一次變成「1 黃」再處理）。`,
      hold: "白面朝下；依情況擺好再轉公式 2",
      showAlg: "alg2",
      cases: ["1", "2", "0"],
      preset: "yellow-work",
    },
    {
      id: "step4",
      short: "步驟4",
      title: "第四步：黃色側面調好",
      body: `與第二步相同：看黃層側面有無相同色對，放到<strong>左手邊</strong>，轉<strong>公式 1</strong>。若沒有成對，先轉一次公式 1。最後只轉上層（AUF）對齊顏色即可完成。`,
      hold: "相同色對放左手邊，再轉公式 1，最後轉上層對齊",
      showAlg: "alg1",
      cases: null,
      preset: "almost",
    },
    {
      id: "done",
      short: "完成",
      title: "完成！",
      body: `兩個公式就能解完 2×2。熟練後可銜接原站的 3×3 簡易解法（符號與流程相通）。`,
      hold: "六面完成 —— 可以再打亂練一次",
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
    progress: document.getElementById("progress"),
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
    // z2: white to bottom, yellow to top
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
    if (name === "white-up" || name === "white-layer") {
      // already white on U
    } else if (name === "yellow-work") {
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
      els.algLabel.textContent = "公式 1 · F R' F L2 F' R F L2 F2（原站 61677-34677-66）";
    } else if (step.showAlg === "alg2") {
      activeAlg = [...ALG2];
      els.algLabel.textContent = "公式 2 · R' U' R U' R' U2 R（原站 12421554）";
    } else {
      activeAlg = [...ALG1];
      els.algLabel.textContent = "兩個公式預覽 · 先看公式 1，下一步可切換練習公式 2";
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
    const labels = {
      "1": "1 黃朝上",
      "2": "2 黃朝上",
      "0": "0 黃朝上",
    };
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

  function renderProgress() {
    els.progress.innerHTML = "";
    steps.forEach((step, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = step.short;
      btn.classList.toggle("active", i === stepIndex);
      btn.classList.toggle("done", i < stepIndex);
      btn.addEventListener("click", () => goTo(i));
      els.progress.appendChild(btn);
    });
  }

  function renderStep() {
    const step = steps[stepIndex];
    els.stepTitle.textContent = step.title;
    els.stepBody.innerHTML = step.body;
    els.hold.textContent = step.hold;
    els.btnPrev.disabled = stepIndex === 0;
    els.btnNext.disabled = stepIndex === steps.length - 1;
    renderProgress();
    renderCases();
    setPreset(step.preset);
    loadAlgForStep();
  }

  function goTo(index) {
    stepIndex = Math.max(0, Math.min(steps.length - 1, index));
    renderStep();
  }

  function pulseCube() {
    els.cube.classList.remove("pulse");
    // force reflow
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
      els.btnPlay.textContent = "播放公式";
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
        els.btnPlay.textContent = "播放公式";
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
    els.btnPlay.textContent = "播放公式";
    stepOnce();
  });
  els.btnReset.addEventListener("click", () => {
    stopPlay();
    els.btnPlay.textContent = "播放公式";
    playCursor = -1;
    setPreset(steps[stepIndex].preset);
    paintMoveHighlight();
  });

  // Alg switch on notation step: toggle between alg1/alg2 via double-click label
  els.algLabel.addEventListener("click", () => {
    const step = steps[stepIndex];
    if (step.showAlg !== "both") return;
    if (activeAlg[0] === "F") {
      activeAlg = [...ALG2];
      els.algLabel.textContent = "公式 2 · R' U' R U' R' U2 R（點此切換公式 1）";
    } else {
      activeAlg = [...ALG1];
      els.algLabel.textContent = "公式 1 · F R' F L2 F' R F L2 F2（點此切換公式 2）";
    }
    stopPlay();
    playCursor = -1;
    els.btnPlay.textContent = "播放公式";
    renderMoves(activeAlg);
    paintMoveHighlight();
  });

  buildCubeDom();
  faces = solvedFaces();
  renderStep();
})();

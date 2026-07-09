const CONFIG = {
  username: "Babydoll",
  password: "1121",
  birthday: "2026-07-05T00:00:00+05:30",
  giftLocation: "I tried to hide it, but it ever done, so it is given by me.",
  backgroundMusic: "/audio/Vaa-Vaa-Penne-MassTamilan.org.mp3",
  backgroundVolume: 0.2,
  unlockTime: "2026-07-10T07:30:00+05:30"
};

if (Date.now() < new Date(CONFIG.unlockTime).getTime()) {
  window.location.replace("/");
  throw new Error("Wait it is locked until the countdown finishes.");
}

const state = {
  attempts: 3,
  lockedUntil: 0,
  achievements: new Set(),
  selectedTile: null,
  quizIndex: 0,
  muted: false,
  audio: null,
  finalStarted: false,
  confetti: []
};

const scenes = [...document.querySelectorAll(".scene")];
const toast = document.querySelector("#toast");
const heartLayer = document.querySelector("#heartLayer");
const cursorStar = document.querySelector(".cursor-star");
const skyCanvas = document.querySelector("#skyCanvas");
const skyCtx = skyCanvas.getContext("2d");
const celebrationCanvas = document.querySelector("#celebrationCanvas");
const celebrationCtx = celebrationCanvas.getContext("2d");
const confettiCanvas = document.querySelector("#confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function unlock(key) {
  if (state.achievements.has(key)) return;
  state.achievements.add(key);
  document.querySelectorAll(`[data-requires="${key}"]`).forEach((button) => button.classList.remove("locked"));
  const allDone = ["hearts", "puzzle", "scratch", "quiz", "map", "box"].every((item) => state.achievements.has(item));
  if (allDone) document.querySelectorAll('[data-requires="all"]').forEach((button) => button.classList.remove("locked"));
  burstConfetti();
}

function go(sceneName) {
  scenes.forEach((scene) => scene.classList.toggle("active", scene.dataset.scene === sceneName));
  if (sceneName === "welcome") typeInto("#typedWelcome", "Today isn't just your birthday.\n\nToday...\nthe universe celebrates\nthe day\nyou came into my life.");
  if (sceneName === "puzzle") buildPuzzle();
  if (sceneName === "scratch") initScratch();
  if (sceneName === "quiz") renderQuiz();
  if (sceneName === "letter") {
    const letterScroll = document.querySelector("#letterScroll");
    if (letterScroll) letterScroll.scrollTop = 0;
    typeInto("#typedLetter", "To the one who owns my heart...\n\nUnaku theriyum how much I love you. Sometimes kovathula unna hurt pandra mathiri pesi irupen, really sorry.\n\nYou want to know one thing? I'm ready to change anything for your happiness.\n\nI really want you in my whole life till my last 7 minutes.\n\nYou make ordinary days feel remembered before they are even over.\n\nEnaku epovum unooda happiness tha mukkiyam. I'm really grateful to have you in my life.\n\nHappy Birthday, my everything.");
  }
  if (sceneName === "final") startFinale();
}

function typeInto(selector, text, speed = 42, done) {
  const el = document.querySelector(selector);
  if (!el || el.dataset.done === text) return;
  el.dataset.done = text;
  el.textContent = "";
  let index = 0;
  const timer = setInterval(() => {
    el.textContent += text[index] || "";
    index += 1;
    if (index > text.length) {
      clearInterval(timer);
      if (done) done();
    }
  }, speed);
}

function resizeCanvases() {
  [skyCanvas, celebrationCanvas, confettiCanvas].forEach((canvas) => {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
  });
}

function drawSky() {
  skyCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
  for (let i = 0; i < 120; i += 1) {
    const x = (Math.sin(i * 999) * 0.5 + 0.5) * skyCanvas.width;
    const y = (Math.cos(i * 777) * 0.5 + 0.5) * skyCanvas.height;
    const alpha = 0.35 + Math.sin(Date.now() / 700 + i) * 0.25;
    skyCtx.fillStyle = `rgba(255,255,255,${alpha})`;
    skyCtx.beginPath();
    skyCtx.arc(x, y, (i % 3) + 0.8, 0, Math.PI * 2);
    skyCtx.fill();
  }
  requestAnimationFrame(drawSky);
}

function startMusic() {
  if (state.audio) {
    if (state.audio.ended) return;
    state.audio.volume = state.muted ? 0 : CONFIG.backgroundVolume;
    state.audio.play().catch(() => {});
    return;
  }

  const audio = new Audio(CONFIG.backgroundMusic);
  audio.volume = state.muted ? 0 : CONFIG.backgroundVolume;
  audio.loop = false;
  audio.preload = "auto";
  state.audio = audio;
  audio.play().catch(() => showToast("Tap once to allow background music."));
}

function setupLogin() {
  const form = document.querySelector("#loginForm");
  const message = document.querySelector("#loginMessage");
  const hints = document.querySelector("#loginHints");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (Date.now() < state.lockedUntil) return;
    const username = document.querySelector("#username").value.trim().toLowerCase();
    const password = document.querySelector("#password").value.trim().toLowerCase();
    if (username === CONFIG.username.toLowerCase() && password === CONFIG.password.toLowerCase()) {
      message.textContent = "Welcome back, birthday girl.";
      startMusic();
      go("welcome");
      return;
    }
    state.attempts -= 1;
    if (state.attempts <= 0) {
      hints.hidden = false;
      state.lockedUntil = Date.now() + 30000;
      const timer = setInterval(() => {
        const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
        message.textContent = remaining > 0 ? `The love vault is locked. Wait ${remaining} seconds...` : "Try again, softly.";
        if (remaining <= 0) {
          state.attempts = 3;
          clearInterval(timer);
        }
      }, 300);
    } else {
      const usedAttempts = 3 - state.attempts;
      if (usedAttempts >= 2) hints.hidden = false;
      message.textContent = usedAttempts >= 2
        ? `Hints unlocked. Attempts Left: ${state.attempts}`
        : `Oops... This heart doesn't recognize you. Attempts Left: ${state.attempts}`;
    }
  });
}

function setupTimeline() {
  const card = document.querySelector("#memoryCard");
  const dots = [...document.querySelectorAll(".memory-dot")];
  const setMemory = (button) => {
    dots.forEach((dot) => dot.classList.toggle("active", dot === button));
    const [title, date, copy] = button.dataset.memory.split("|");
    card.innerHTML = `<p class="eyebrow">${date}</p><h2>${title}</h2><p>${copy}</p>`;
  };
  dots.forEach((button) => button.addEventListener("click", () => setMemory(button)));
  setMemory(dots[0]);
}

function setupHeartGame() {
  const area = document.querySelector("#heartGameArea");
  const basket = document.querySelector("#basket");
  const scoreEl = document.querySelector("#heartScore");
  let score = 0;
  let running = false;
  const moveBasket = (clientX) => {
    const rect = area.getBoundingClientRect();
    basket.style.left = `${Math.max(44, Math.min(rect.width - 44, clientX - rect.left))}px`;
  };
  area.addEventListener("mousemove", (event) => moveBasket(event.clientX));
  area.addEventListener("touchmove", (event) => moveBasket(event.touches[0].clientX), { passive: true });
  document.querySelector("#startHearts").addEventListener("click", () => {
    if (running) return;
    running = true;
    score = 0;
    scoreEl.textContent = score;
    const spawn = setInterval(() => {
      if (score >= 20) {
        clearInterval(spawn);
        running = false;
        showToast("Mission Complete. Unlock next page.");
        unlock("hearts");
        return;
      }
      const heart = document.createElement("span");
      heart.className = "falling-heart";
      heart.innerHTML = "&hearts;";
      heart.style.left = `${Math.random() * (area.clientWidth - 30)}px`;
      area.appendChild(heart);
      let y = -30;
      const fall = setInterval(() => {
        y += 4;
        heart.style.top = `${y}px`;
        const heartBox = heart.getBoundingClientRect();
        const basketBox = basket.getBoundingClientRect();
        const caught = heartBox.bottom >= basketBox.top && heartBox.left < basketBox.right && heartBox.right > basketBox.left;
        if (caught) {
          score += 1;
          scoreEl.textContent = score;
          heart.remove();
          clearInterval(fall);
        }
        if (y > area.clientHeight) {
          heart.remove();
          clearInterval(fall);
        }
      }, 16);
    }, 260);
  });
}

function buildPuzzle() {
  const board = document.querySelector("#puzzleBoard");
  if (board.children.length) return;
  [4, 0, 2, 7, 1, 5, 3, 8, 6].forEach((piece) => {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.dataset.piece = piece;
    tile.style.backgroundPosition = `${(piece % 3) * 50}% ${Math.floor(piece / 3) * 50}%`;
    tile.addEventListener("click", () => selectTile(tile));
    board.appendChild(tile);
  });
}

function selectTile(tile) {
  if (!state.selectedTile) {
    state.selectedTile = tile;
    tile.classList.add("selected");
    return;
  }
  const first = state.selectedTile;
  const tempPiece = first.dataset.piece;
  const tempPosition = first.style.backgroundPosition;
  first.dataset.piece = tile.dataset.piece;
  first.style.backgroundPosition = tile.style.backgroundPosition;
  tile.dataset.piece = tempPiece;
  tile.style.backgroundPosition = tempPosition;
  first.classList.remove("selected");
  state.selectedTile = null;
  const solved = [...document.querySelectorAll(".tile")].every((item, index) => Number(item.dataset.piece) === index);
  if (solved) {
    document.querySelector("#puzzleStatus").textContent = "Perfect. Just like us.";
    unlock("puzzle");
  }
}

function initScratch() {
  const canvas = document.querySelector("#scratchCanvas");
  if (canvas.dataset.ready) return;
  canvas.dataset.ready = "true";
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#bfc5cf";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7f7f7";
  ctx.font = "700 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Scratch here", canvas.width / 2, canvas.height / 2);
  let scratched = 0;
  const scratch = (event) => {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    const x = (point.clientX - rect.left) * (canvas.width / rect.width);
    const y = (point.clientY - rect.top) * (canvas.height / rect.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    scratched += 1;
    if (scratched > 32) unlock("scratch");
  };
  canvas.addEventListener("pointermove", (event) => event.buttons && scratch(event));
  canvas.addEventListener("touchmove", scratch, { passive: true });
}

const quiz = [
  { q: "Where did we first meet?", a: ["In our Insta Notes", "On the class", "At a mall", "Inside our heart"], correct: 0 },
  { q: "What's my favorite color?", a: ["Blue", "Grey", "Black", "The color of your smile"], correct: 3 },
  { q: "Who's more stubborn?", a: ["You", "Me", "Both of us"], correct: 2 }
];

function renderQuiz() {
  const item = quiz[state.quizIndex];
  if (!item) {
    document.querySelector("#quizQuestion").textContent = "Wow you remember that!!";
    document.querySelector("#quizAnswers").innerHTML = "";
    unlock("quiz");
    return;
  }
  document.querySelector("#quizQuestion").textContent = item.q;
  document.querySelector("#quizAnswers").innerHTML = item.a.map((answer, index) => `<button data-answer="${index}">${answer}</button>`).join("");
  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const correct = Number(button.dataset.answer) === item.correct;
      document.querySelector("#quizFeedback").textContent = correct ? "Wow you remember that!!" : "Hmm... Think a while.";
      if (correct) state.quizIndex += 1;
      setTimeout(renderQuiz, 700);
    });
  });
}

function setupMap() {
  const map = document.querySelector("#treasureMap");
  const hint = document.querySelector("#mapHint");
  const x = document.querySelector("#hiddenX");
  map.addEventListener("mousemove", (event) => {
    const rect = x.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
    hint.textContent = distance < 55 ? "Very Close..." : distance < 150 ? "Warmer..." : "Cold...";
  });
  x.addEventListener("click", () => {
    hint.textContent = "X found. The box is waiting.";
    unlock("map");
  });
}

function setupPolaroids() {
  const lightbox = document.querySelector("#memoryLightbox");
  const photo = document.querySelector("#memoryPhoto");
  const date = document.querySelector("#memoryDate");
  const title = document.querySelector("#memoryTitle");
  const text = document.querySelector("#memoryText");
  const close = document.querySelector("#closeMemory");

  const hideMemory = () => {
    lightbox.hidden = true;
    lightbox.classList.remove("show");
  };

  document.querySelectorAll(".polaroid").forEach((polaroid) => {
    polaroid.addEventListener("click", () => {
      photo.src = polaroid.dataset.photo;
      photo.alt = `${polaroid.dataset.title} memory`;
      date.textContent = polaroid.dataset.date;
      title.textContent = polaroid.dataset.title;
      text.textContent = polaroid.dataset.memory;
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add("show"));
      createHeart(innerWidth / 2, innerHeight / 2);
    });
  });

  close.addEventListener("click", hideMemory);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) hideMemory();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) hideMemory();
  });
}

function setupBox() {
  const box = document.querySelector("#giftBox");
  const reveal = document.querySelector("#giftReveal");
  let opened = false;
  const open = () => {
    if (opened) return;
    opened = true;
    box.classList.add("shake");
    setTimeout(() => {
      reveal.hidden = false;
      reveal.querySelector("strong").textContent = CONFIG.giftLocation;
      unlock("box");
      showToast("The final reveal is opening...");
      setTimeout(() => go("final"), 3200);
    }, 1200);
  };
  box.addEventListener("click", open);
  box.addEventListener("keydown", (event) => (event.key === "Enter" || event.key === " ") && open());
  document.querySelector("#openBox").addEventListener("click", open);
}

function createHeart(x, y, text = "&hearts;") {
  const heart = document.createElement("span");
  heart.className = "float-heart";
  heart.innerHTML = text;
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  heartLayer.appendChild(heart);
  setTimeout(() => heart.remove(), 1400);
}

function setupEasterEggs() {
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  const pressed = [];
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "h") showToast("I Love You");
    pressed.push(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    pressed.splice(0, Math.max(0, pressed.length - konami.length));
    if (konami.every((key, index) => pressed[index] === key)) showToast("Secret message: you are my favorite miracle.");
  });
  document.addEventListener("mousemove", (event) => {
    cursorStar.style.left = `${event.clientX}px`;
    cursorStar.style.top = `${event.clientY}px`;
    if (Math.random() > 0.84) createHeart(event.clientX, event.clientY);
  });
  document.addEventListener("scroll", () => createHeart(innerWidth - 52, innerHeight - 90), { passive: true });
  document.querySelector("#moonButton").addEventListener("click", () => {
    showToast("I remind you one thing ur always mine...");
    createHeart(46, 48, "\u263E");
  });
  document.querySelector(".heart-mark").addEventListener("click", (event) => {
    showToast("You found a secret!");
    createHeart(event.clientX, event.clientY);
  });
  document.querySelector("#portalTitle").addEventListener("dblclick", () => {
    showToast("Hidden note: every path here leads back to you.");
    burstConfetti();
  });
  document.querySelector("#themeToggle").addEventListener("click", () => document.body.classList.toggle("day"));
  document.querySelector("#muteToggle").addEventListener("click", (event) => {
    state.muted = !state.muted;
    event.currentTarget.textContent = state.muted ? "x" : "\u266A";
    if (state.audio) state.audio.volume = state.muted ? 0 : CONFIG.backgroundVolume;
  });
  document.querySelector("#voiceButton").addEventListener("click", () => {
    const speech = new SpeechSynthesisUtterance("Happy Birthday. I hope this little journey makes you smile, because you make my world brighter every day.");
    speech.rate = 0.9;
    speechSynthesis.speak(speech);
  });
  document.querySelector("#scrollLetter").addEventListener("click", () => {
    const letterScroll = document.querySelector("#letterScroll");
    letterScroll.scrollBy({ top: Math.max(180, letterScroll.clientHeight * 0.72), behavior: "smooth" });
  });
  document.querySelector("#secretDoor").addEventListener("click", () => go("secret"));
}

function setupPetals() {
  const petals = document.querySelector("#petals");
  setInterval(() => {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.textContent = "*";
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.top = "-30px";
    petal.style.fontSize = `${14 + Math.random() * 18}px`;
    petals.appendChild(petal);
    setTimeout(() => petal.remove(), 8200);
  }, 520);
}

function burstConfetti() {
  const colors = ["#ff5f9f", "#f8d36d", "#7ee7c9", "#6db7ff", "#ffffff"];
  for (let i = 0; i < 90; i += 1) {
    state.confetti.push({
      x: innerWidth * devicePixelRatio / 2,
      y: innerHeight * devicePixelRatio * 0.35,
      vx: (Math.random() - 0.5) * 15 * devicePixelRatio,
      vy: (-8 - Math.random() * 8) * devicePixelRatio,
      size: (5 + Math.random() * 8) * devicePixelRatio,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length],
      life: 90 + Math.random() * 40
    });
  }
}

function drawConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  state.confetti = state.confetti.filter((piece) => piece.life > 0);
  state.confetti.forEach((piece) => {
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vy += 0.32 * devicePixelRatio;
    piece.rotation += piece.spin;
    piece.life -= 1;
    confettiCtx.save();
    confettiCtx.translate(piece.x, piece.y);
    confettiCtx.rotate(piece.rotation);
    confettiCtx.fillStyle = piece.color;
    confettiCtx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.55);
    confettiCtx.restore();
  });
  requestAnimationFrame(drawConfetti);
}

let fireworksRunning = false;
function drawFireworks() {
  celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
  if (fireworksRunning) {
    for (let i = 0; i < 36; i += 1) {
      const t = Date.now() / 600 + i;
      const cx = (0.18 + (i % 4) * 0.22) * celebrationCanvas.width;
      const cy = (0.18 + Math.floor(i / 4) * 0.08) * celebrationCanvas.height;
      celebrationCtx.fillStyle = ["#ff5f9f", "#f8d36d", "#7ee7c9", "#6db7ff"][i % 4];
      celebrationCtx.beginPath();
      celebrationCtx.arc(cx + Math.cos(t) * 70, cy + Math.sin(t) * 70, 3, 0, Math.PI * 2);
      celebrationCtx.fill();
    }
  }
  requestAnimationFrame(drawFireworks);
}

function startFinale() {
  if (state.finalStarted) return;
  state.finalStarted = true;
  fireworksRunning = false;
  startMusic();
  const finalTyped = document.querySelector("#finalTyped");
  const birthdayFinale = document.querySelector("#birthdayFinale");
  const secretDoor = document.querySelector("#secretDoor");
  birthdayFinale.hidden = true;
  secretDoor.style.opacity = "0";

  typeInto("#finalTyped", "One last thing...", 58, () => {
    setTimeout(() => {
      typeInto("#finalTyped", "This website may end here...", 58, () => {
        setTimeout(() => {
          typeInto(
            "#finalTyped",
            "But I hope our story keeps creating beautiful memories for many birthdays to come. \u2665",
            45,
            () => {
              setTimeout(() => {
                finalTyped.classList.add("final-typed-complete");
                birthdayFinale.hidden = false;
                secretDoor.style.opacity = "";
                fireworksRunning = true;
                burstConfetti();
              }, 1600);
            }
          );
        }, 2200);
      });
    }, 1600);
  });
}

function runOpening() {
  const percent = document.querySelector("#loadingPercent");
  const copy = document.querySelector("#loadingCopy");
  const title = document.querySelector("#loadingTitle");
  const steps = [
    { value: "0%", delay: 350 },
    { value: "15%", delay: 850 },
    { value: "30%", delay: 1350 },
    { value: "50%", delay: 1900 },
    { value: "100%", delay: 2600 }
  ];

  steps.forEach((step) => {
    setTimeout(() => {
      percent.textContent = step.value;
      createHeart(innerWidth / 2 + (Math.random() - 0.5) * 180, innerHeight / 2 + 100, "*");
    }, step.delay);
  });

  setTimeout(() => {
    copy.textContent = "";
    title.classList.add("show");
  }, 3200);
  setTimeout(() => go("login"), 5200);
}

document.querySelectorAll(".next-button").forEach((button) => button.addEventListener("click", () => go(button.dataset.next)));
addEventListener("resize", resizeCanvases);
resizeCanvases();
drawSky();
drawFireworks();
drawConfetti();
setupLogin();
setupTimeline();
setupHeartGame();
setupMap();
setupPolaroids();
setupBox();
setupEasterEggs();
setupPetals();
runOpening();

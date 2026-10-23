// ---------- Question bank (5 are picked randomly each run) ----------
const bank = [
  { q: "Which method selects element by ID in JavaScript?", options: ["getElementById()", "querySelectorAll()", "getElementsByTag()", "selectId()"], answer: "getElementById()" },
  { q: "Which HTML attribute is used to link CSS?", options: ["src", "link", "rel", "href"], answer: "rel" },
  { q: "Which method removes the last element of an array?", options: ["shift()", "pop()", "splice()", "slice()"], answer: "pop()" },
  { q: "Which JS array method adds element to end?", options: ["push()", "unshift()", "concat()", "add()"], answer: "push()" },
  { q: "Which CSS property changes text color?", options: ["font-color", "text-color", "color", "background"], answer: "color" },
  { q: "Which JS keyword declares a block-scoped variable?", options: ["const", "let", "var", "all of these"], answer: "let" },
  { q: "Which HTML tag is used for the largest heading?", options: ["<h6>", "<head>", "<h1>", "<heading>"], answer: "<h1>" },
  { q: "Which CSS property controls the space inside an element's border?", options: ["margin", "padding", "spacing", "gap"], answer: "padding" },
  { q: "What does DOM stand for?", options: ["Data Object Model", "Document Object Model", "Display Output Method", "Digital Order Map"], answer: "Document Object Model" },
  { q: "Which symbol is used for an ID selector in CSS?", options: [".", "#", "*", "&"], answer: "#" }
];

const TOTAL = 5;       // questions per run
const TIME = 15;       // seconds per question
const RING = 119.4;    // circumference of timer ring (2 * PI * 19)

let questions = [], current = 0, answers = [], score = 0, timeLeft = TIME, timerId = null;

const $ = id => document.getElementById(id);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Start / restart ----------
function startQuiz() {
  questions = shuffle(bank).slice(0, TOTAL).map(q => ({ ...q, options: shuffle(q.options) }));
  current = 0;
  score = 0;
  answers = new Array(TOTAL).fill(null);
  $("startCard").classList.add("hidden");
  $("resultCard").classList.add("hidden");
  $("quizWrap").classList.remove("hidden");
  stopConfetti();
  buildProgress();
  showQuestion();
}

function buildProgress() {
  $("progress").innerHTML = "";
  for (let i = 0; i < TOTAL; i++) {
    const s = document.createElement("div");
    s.className = "segment";
    $("progress").appendChild(s);
  }
}

function updateProgress() {
  document.querySelectorAll(".segment").forEach((s, i) => {
    s.classList.toggle("active", i <= current);
    s.classList.toggle("current", i === current);
  });
}

// ---------- Show a question ----------
function showQuestion() {
  const q = questions[current];
  $("qCount").textContent = `Question ${current + 1} / ${TOTAL}`;
  $("question").textContent = q.q;
  $("scoreLive").textContent = `Score: ${score}`;
  $("nextBtn").disabled = true;
  $("nextBtn").textContent = current === TOTAL - 1 ? "Finish ✓" : "Next →";
  $("options").innerHTML = "";

  q.options.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "option";
    b.innerHTML = `<span class="letter">${"ABCD"[i]}</span><span class="text"></span>`;
    b.querySelector(".text").textContent = opt;
    b.onclick = () => selectAnswer(opt);
    $("options").appendChild(b);
  });

  const card = $("quizCard");
  card.classList.remove("slide"); void card.offsetWidth; card.classList.add("slide");

  updateProgress();
  startTimer();
}

// ---------- Timer ----------
function renderTimer() {
  $("timer").textContent = timeLeft;
  $("ringFg").style.strokeDashoffset = RING * (1 - timeLeft / TIME);
  $("timerBox").classList.toggle("warn", timeLeft <= 5);
}

function startTimer() {
  clearInterval(timerId);
  timeLeft = TIME;
  $("ringFg").style.transition = "none";
  renderTimer();
  void $("ringFg").getBoundingClientRect();
  $("ringFg").style.transition = "";
  timerId = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(timerId);
      lockOptions(null);          // time up: not answered
    }
  }, 1000);
}

// ---------- Answer handling ----------
function selectAnswer(choice) {
  clearInterval(timerId);
  answers[current] = choice;
  if (choice === questions[current].answer) score++;
  $("scoreLive").textContent = `Score: ${score}`;
  lockOptions(choice);
}

function lockOptions(choice) {
  const correct = questions[current].answer;
  document.querySelectorAll(".option").forEach(b => {
    const text = b.querySelector(".text").textContent;
    b.disabled = true;
    if (text === correct) b.classList.add("correct");
    else if (text === choice) b.classList.add("wrong");
    else b.classList.add("dim");
  });
  $("nextBtn").disabled = false;
}

$("nextBtn").onclick = () => {
  if (current < TOTAL - 1) {
    current++;
    showQuestion();
  } else {
    showResult();
  }
};

// ---------- Result ----------
function showResult() {
  clearInterval(timerId);
  $("quizWrap").classList.add("hidden");
  $("resultCard").classList.remove("hidden");
  $("resultCard").classList.add("pop");

  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";
  questions.forEach((q, i) => {
    const ok = answers[i] === q.answer;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td></td><td></td><td></td><td class="${ok ? "Correct" : "Incorrect"}">${ok ? "Correct" : "Incorrect"}</td>`;
    tr.children[1].textContent = q.q;
    tr.children[2].textContent = answers[i] || "Not Answered";
    tr.children[3].textContent = q.answer;
    tbody.appendChild(tr);
  });

  const pct = Math.round((score / TOTAL) * 100);
  $("score").textContent = `Score: ${score} / ${TOTAL}`;
  $("scoreText").textContent = `${score} / ${TOTAL}`;
  $("scorePct").textContent = pct + "%";
  $("scoreRing").style.setProperty("--pct", pct);
  $("resultTitle").textContent =
    pct === 100 ? "Perfect! 🏆" : pct >= 60 ? "Great job! 🎉" : "Keep practicing 💪";
  if (pct >= 60) launchConfetti();
}

// ---------- PDF download ----------
$("pdfBtn").onclick = () => {
  if (!window.jspdf) { alert("PDF library failed to load. Check your internet connection."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Quiz Result", 14, 20);
  doc.setFontSize(14);
  doc.text(`Score: ${score} / ${TOTAL}`, 14, 30);

  const rows = questions.map((q, i) => [
    i + 1, q.q, answers[i] || "Not Answered", q.answer,
    answers[i] === q.answer ? "Correct" : "Incorrect"
  ]);
  doc.autoTable({
    startY: 36,
    head: [["#", "Question", "Your Answer", "Correct Answer", "Status"]],
    body: rows,
    headStyles: { fillColor: [220, 220, 220], textColor: 0 },
    didParseCell: d => {
      if (d.section === "body" && d.column.index === 4) {
        d.cell.styles.fillColor = d.cell.raw === "Correct" ? [25, 135, 84] : [220, 53, 69];
        d.cell.styles.textColor = 255;
      }
    }
  });
  doc.save("Quiz_Result.pdf");
};

$("startBtn").onclick = startQuiz;
$("restartBtn").onclick = startQuiz;

// ---------- Confetti (simple canvas) ----------
let confettiId = null;
function stopConfetti() {
  cancelAnimationFrame(confettiId);
  const c = $("confetti");
  c.getContext("2d").clearRect(0, 0, c.width, c.height);
}
function launchConfetti() {
  const c = $("confetti"), ctx = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const colors = ["#3b82f6", "#16a34a", "#facc15", "#ef4444", "#8b5cf6"];
  const bits = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width, y: -Math.random() * c.height * .5,
    s: 6 + Math.random() * 8, v: 2 + Math.random() * 4, d: Math.random() * 6,
    c: colors[Math.floor(Math.random() * colors.length)]
  }));
  let frames = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    bits.forEach(b => {
      b.y += b.v; b.x += Math.sin((frames + b.d * 10) / 20) * 1.5;
      ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, b.s, b.s * .6);
    });
    if (++frames < 260) confettiId = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

// ---------- Dark / light mode ----------
function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  try { localStorage.setItem("quizDark", dark ? "1" : "0"); } catch (e) {}
}
$("themeBtn").onclick = () => applyTheme(!document.body.classList.contains("dark"));
try { applyTheme(localStorage.getItem("quizDark") === "1"); } catch (e) {}

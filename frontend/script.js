// ===============================
// THINKATHON QUIZ SCRIPT (FINAL)
// ===============================

let filteredQuestions = [];
let currentQuestion = 0;
let score = 0;
let attempted = 0;

let timer;
let totalTime = 300; // 5 minutes
let timeLeft = totalTime;

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");

// ===============================
// LOAD CATEGORIES FROM BACKEND
// ===============================
function loadQuizCategories() {

  fetch("http://localhost:3000/categories")
    .then(res => res.json())
    .then(data => {

      categorySelect.innerHTML = `<option value="">-- Select Category --</option>`;

      data.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.name;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      });

    })
    .catch(err => console.error("Category load error:", err));
}

loadQuizCategories();

// ===============================
// START QUIZ
// ===============================
function startQuiz() {

  const category = categorySelect.value;
  const difficulty = difficultySelect.value;

  if (!category || !difficulty) {
    alert("Please select category and difficulty");
    return;
  }

  fetch(`http://localhost:3000/questions?category=${category}&difficulty=${difficulty}`)
    .then(res => res.json())
    .then(data => {

      if (!data || data.length === 0) {
        alert("No questions available");
        return;
      }

      filteredQuestions = data;

      currentQuestion = 0;
      score = 0;
      attempted = 0;

      // RESET TIMER
      clearInterval(timer);
      timeLeft = totalTime;

      document.getElementById("quizSetup").style.display = "none";
      document.getElementById("quizArea").style.display = "block";

      startTimer();
      loadQuestion();
    })
    .catch(err => console.error("Quiz load error:", err));
}

// ===============================
// LOAD QUESTION
// ===============================
function loadQuestion() {

  if (!filteredQuestions[currentQuestion]) return;

  const q = filteredQuestions[currentQuestion];

  document.getElementById("questionNo").innerText =
    "Question " + (currentQuestion + 1);

  document.getElementById("questionText").innerText =
    q.question || "No question";

  // ✅ SAFE OPTIONS (NO UNDEFINED)
  document.getElementById("optA").innerText = q.optA ? q.optA : "N/A";
  document.getElementById("optB").innerText = q.optB ? q.optB : "N/A";
  document.getElementById("optC").innerText = q.optC ? q.optC : "N/A";
  document.getElementById("optD").innerText = q.optD ? q.optD : "N/A";

  document.getElementById("optionsForm").reset();
}

// ===============================
// TIMER (5 MINUTES)
// ===============================
function startTimer() {

  document.getElementById("timer").innerText = "Time Left: 5:00";

  timer = setInterval(() => {

    timeLeft--;

    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    if (seconds < 10) seconds = "0" + seconds;

    document.getElementById("timer").innerText =
      `Time Left: ${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      endQuiz();
    }

  }, 1000);
}

// ===============================
// NEXT QUESTION
// ===============================
function nextQuestion() {

  const selected =
    document.querySelector('input[name="option"]:checked');

  if (selected) {

    attempted++;

    const answer = selected.value;

    if (answer === filteredQuestions[currentQuestion].correct) {
      score++;
    }
  }

  currentQuestion++;

  if (currentQuestion < filteredQuestions.length) {
    loadQuestion();
  } else {
    clearInterval(timer);
    endQuiz();
  }
}

// ===============================
// END QUIZ
// ===============================
function endQuiz() {

  clearInterval(timer);

  const username = localStorage.getItem("loggedUser") || "User";
  const category = categorySelect.value;
  const difficulty = difficultySelect.value;

  const total = filteredQuestions.length;
  const wrong = attempted - score;

  fetch("http://localhost:3000/save-result", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      username,
      category,
      difficulty,
      total,
      attempted,
      correct: score,
      wrong
    })

  })
  .then(res => res.json())
  .then(() => {
    window.location.href = "result.html";
  })
  .catch(err => {
    console.error("Error saving result:", err);
    alert("Result saving failed. Is backend running?");
  });
}
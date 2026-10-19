const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ================= DATABASE ================= */

const db = new sqlite3.Database("./quiz.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

/* ================= TABLES ================= */

db.serialize(() => {

  // USERS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // ✅ DEFAULT ADMIN (no console log)
  db.get(`SELECT * FROM users WHERE username='admin'`, (err, row) => {
    if (!row) {
      db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        ["admin", "admin123", "admin"]
      );
    }
  });

  // CATEGORIES TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `);

  // QUESTIONS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      question TEXT,
      optA TEXT,
      optB TEXT,
      optC TEXT,
      optD TEXT,
      correct TEXT,
      difficulty TEXT
    )
  `);

  // RESULTS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      category TEXT,
      difficulty TEXT,
      total INTEGER,
      attempted INTEGER,
      correct INTEGER,
      wrong INTEGER
    )
  `);

});

/* ================= USER ROUTES ================= */

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, password, "user"],
    function (err) {
      if (err) {
        res.json({ success: false, message: "Username already exists" });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username=? AND password=?`,
    [username, password],
    (err, row) => {
      if (row) {
        res.json({
          success: true,
          role: row.role,
          username: row.username
        });
      } else {
        res.json({
          success: false,
          message: "Invalid credentials"
        });
      }
    }
  );
});

/* ================= CATEGORY ROUTES ================= */

// Add category
app.post("/add-category", (req, res) => {
  const { name } = req.body;

  db.run(
    `INSERT INTO categories (name) VALUES (?)`,
    [name],
    function (err) {
      if (err) {
        res.json({ success: false, message: "Category exists" });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Get categories
app.get("/categories", (req, res) => {
  db.all(`SELECT * FROM categories`, [], (err, rows) => {
    res.json(rows);
  });
});

/* ================= QUESTION ROUTES ================= */

// Add question
app.post("/add-question", (req, res) => {
  const { category, question, optA, optB, optC, optD, correct, difficulty } = req.body;

  db.run(
    `INSERT INTO questions (category, question, optA, optB, optC, optD, correct, difficulty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [category, question, optA, optB, optC, optD, correct, difficulty],
    function (err) {
      if (err) {
        console.error("Insert Error:", err);
        res.json({ success: false });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// ✅ QUIZ QUESTIONS
app.get("/questions", (req, res) => {
  const { category, difficulty } = req.query;

  db.all(
    `SELECT * FROM questions 
     WHERE category=? AND difficulty=? 
     ORDER BY RANDOM() 
     LIMIT 10`,
    [category, difficulty],
    (err, rows) => {
      if (err) {
        console.error(err);
        res.json([]);
      } else {
        res.json(rows);
      }
    }
  );
});

// ✅ ALL QUESTIONS (ADMIN)
app.get("/all-questions", (req, res) => {
  db.all(`SELECT * FROM questions`, [], (err, rows) => {
    res.json(rows);
  });
});

// ✅ GET SINGLE (EDIT)
app.get("/question/:id", (req, res) => {
  db.get(
    `SELECT * FROM questions WHERE id=?`,
    [req.params.id],
    (err, row) => {
      res.json(row);
    }
  );
});

// ✅ UPDATE
app.post("/update-question", (req, res) => {
  const { id, category, question, optA, optB, optC, optD, correct, difficulty } = req.body;

  db.run(
    `UPDATE questions 
     SET category=?, question=?, optA=?, optB=?, optC=?, optD=?, correct=?, difficulty=? 
     WHERE id=?`,
    [category, question, optA, optB, optC, optD, correct, difficulty, id],
    function (err) {
      if (err) {
        console.error("Update Error:", err);
        res.json({ success: false });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Delete
app.delete("/delete-question/:id", (req, res) => {
  db.run(
    `DELETE FROM questions WHERE id=?`,
    [req.params.id],
    function () {
      res.json({ success: true });
    }
  );
});

/* ================= RESULT ROUTES ================= */

app.post("/save-result", (req, res) => {
  const { username, category, difficulty, total, attempted, correct, wrong } = req.body;

  db.run(
    `INSERT INTO results (username, category, difficulty, total, attempted, correct, wrong)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, category, difficulty, total, attempted, correct, wrong],
    function () {
      res.json({ success: true });
    }
  );
});

app.get("/get-last-result", (req, res) => {
  db.get(
    `SELECT * FROM results ORDER BY id DESC LIMIT 1`,
    [],
    (err, row) => {
      res.json(row);
    }
  );
});

/* ================= SERVER ================= */

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
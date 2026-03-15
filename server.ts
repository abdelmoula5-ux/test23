import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite Database
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER,
      text TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );
  `);

  // Seed data if empty
  const pollCount = await db.get('SELECT COUNT(*) as count FROM polls');
  if (pollCount.count === 0) {
    const result = await db.run('INSERT INTO polls (title, description) VALUES (?, ?)', ['Quel est votre langage de programmation préféré ?', 'Sondage pour les développeurs web et backend.']);
    const pollId = result.lastID;
    await db.run('INSERT INTO options (poll_id, text, votes) VALUES (?, ?, ?)', [pollId, 'TypeScript', 15]);
    await db.run('INSERT INTO options (poll_id, text, votes) VALUES (?, ?, ?)', [pollId, 'Python', 10]);
    await db.run('INSERT INTO options (poll_id, text, votes) VALUES (?, ?, ?)', [pollId, 'Rust', 8]);
    await db.run('INSERT INTO options (poll_id, text, votes) VALUES (?, ?, ?)', [pollId, 'Go', 5]);
  }

  // API Routes
  app.get('/api/polls', async (req, res) => {
    try {
      const polls = await db.all('SELECT * FROM polls ORDER BY created_at DESC');
      res.json(polls);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/polls/:id', async (req, res) => {
    try {
      const poll = await db.get('SELECT * FROM polls WHERE id = ?', [req.params.id]);
      if (!poll) return res.status(404).json({ error: 'Poll not found' });
      const options = await db.all('SELECT * FROM options WHERE poll_id = ? ORDER BY id ASC', [req.params.id]);
      const participants = await db.all('SELECT * FROM participants WHERE poll_id = ? ORDER BY created_at DESC LIMIT 50', [req.params.id]);
      res.json({ ...poll, options, participants });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/polls', async (req, res) => {
    const { title, description, options } = req.body;
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Invalid data. Title and at least 2 options are required.' });
    }
    
    try {
      const result = await db.run('INSERT INTO polls (title, description) VALUES (?, ?)', [title, description]);
      const pollId = result.lastID;
      
      const insertedOptions = [];
      for (const opt of options) {
        if (opt.trim()) {
          const optResult = await db.run('INSERT INTO options (poll_id, text) VALUES (?, ?)', [pollId, opt.trim()]);
          insertedOptions.push({ id: optResult.lastID, text: opt.trim(), votes: 0 });
        }
      }
      
      const newPoll = { id: pollId, title, description, options: insertedOptions, participants: [] };
      io.emit('poll_created', newPoll);
      res.json(newPoll);
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/polls/:id/vote', async (req, res) => {
    const { optionId, participantName } = req.body;
    const pollId = req.params.id;
    
    if (!optionId) {
      return res.status(400).json({ error: 'Option ID is required' });
    }

    try {
      // Record vote
      await db.run('UPDATE options SET votes = votes + 1 WHERE id = ? AND poll_id = ?', [optionId, pollId]);
      
      // Record participant if name provided
      if (participantName && participantName.trim()) {
        await db.run('INSERT INTO participants (poll_id, name) VALUES (?, ?)', [pollId, participantName.trim()]);
      }

      // Fetch updated data to broadcast
      const options = await db.all('SELECT * FROM options WHERE poll_id = ? ORDER BY id ASC', [pollId]);
      const participants = await db.all('SELECT * FROM participants WHERE poll_id = ? ORDER BY created_at DESC LIMIT 50', [pollId]);
      
      // Emit real-time update
      io.emit('poll_updated', { pollId: parseInt(pollId), options, participants });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

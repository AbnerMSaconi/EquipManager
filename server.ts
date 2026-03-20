import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const db = new Database('inventory.db');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    rf TEXT UNIQUE,
    username TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    category TEXT,
    minQuantity INTEGER,
    unitValue REAL
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    itemName TEXT NOT NULL,
    userId INTEGER NOT NULL,
    userEmail TEXT NOT NULL,
    actionType TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    destination TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    returnDeadline DATETIME,
    status TEXT DEFAULT 'completed',
    returnDate DATETIME,
    userIdentifier TEXT,
    isDamaged BOOLEAN DEFAULT 0,
    damageDescription TEXT,
    isOperational BOOLEAN DEFAULT 1,
    unitValue REAL,
    FOREIGN KEY(itemId) REFERENCES items(id),
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Migration to fix logs table constraint if it exists
try {
  const tableInfo: any = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='logs'").get();
  const sql = tableInfo?.sql || "";
  if (sql.toUpperCase().includes("CHECK") || sql.toUpperCase().includes("ACTIONTYPE IN")) {
    console.log("Migrating logs table to remove CHECK constraint...");
    db.transaction(() => {
      db.exec("ALTER TABLE logs RENAME TO logs_old;");
      db.exec(`
        CREATE TABLE logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          itemId INTEGER NOT NULL,
          itemName TEXT NOT NULL,
          userId INTEGER NOT NULL,
          userEmail TEXT NOT NULL,
          actionType TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          destination TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          returnDeadline DATETIME,
          status TEXT DEFAULT 'completed',
          returnDate DATETIME,
          userIdentifier TEXT,
          isDamaged BOOLEAN DEFAULT 0,
          damageDescription TEXT,
          isOperational BOOLEAN DEFAULT 1,
          unitValue REAL,
          FOREIGN KEY(itemId) REFERENCES items(id),
          FOREIGN KEY(userId) REFERENCES users(id)
        );
      `);
      db.exec("INSERT INTO logs SELECT * FROM logs_old;");
      db.exec("DROP TABLE logs_old;");
    })();
    console.log("Logs table migration completed.");
  }
} catch (e) {
  console.error("Error during logs table migration:", e);
}

// Migrations for new fields
try { db.exec("ALTER TABLE items ADD COLUMN room TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN cabinet TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN shelf TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN imageUrl TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN minQuantity INTEGER;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN unitValue REAL;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN status TEXT DEFAULT 'completed';"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN returnDate DATETIME;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN rf TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN username TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN userIdentifier TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN isDamaged BOOLEAN DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN damageDescription TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN isOperational BOOLEAN DEFAULT 1;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN unitValue REAL;"); } catch (e) {}

// Seed Admin User
const seedAdmin = () => {
  const adminRf = 'admin';
  const adminUsername = 'admin';
  const adminPassword = '808080';
  const existing = db.prepare('SELECT * FROM users WHERE rf = ? OR username = ?').get(adminRf, adminUsername);
  
  if (!existing) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    // We insert a dummy email since it was NOT NULL in the original schema
    db.prepare('INSERT INTO users (email, password, role, rf, username) VALUES (?, ?, ?, ?, ?)').run('admin@admin.com', hashedPassword, 'admin', adminRf, adminUsername);
    console.log('Admin user registered: admin / 808080');
  }
};
seedAdmin();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Middleware: Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { rf, username, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const dummyEmail = `${rf}@system.local`;
      const result = db.prepare('INSERT INTO users (email, password, rf, username) VALUES (?, ?, ?, ?)').run(dummyEmail, hashedPassword, rf, username);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: 'User already exists' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE rf = ? OR username = ?').get(identifier, identifier);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, rf: user.rf, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, rf: user.rf, username: user.username, role: user.role } });
  });

  // User Management Routes
  app.get('/api/users', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const users = db.prepare('SELECT id, rf, username, role FROM users').all();
    res.json(users);
  });

  app.post('/api/users', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { rf, username, password, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const dummyEmail = `${rf}@system.local`;
      const result = db.prepare('INSERT INTO users (email, password, rf, username, role) VALUES (?, ?, ?, ?, ?)').run(dummyEmail, hashedPassword, rf, username, role || 'user');
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: 'User already exists' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Inventory Routes
  app.get('/api/items', authenticateToken, (req: any, res: any) => {
    const items = db.prepare('SELECT * FROM items').all();
    res.json(items);
  });

  app.post('/api/items', authenticateToken, (req: any, res: any) => {
    const { name, description, quantity, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue } = req.body;
    const result = db.prepare('INSERT INTO items (name, description, quantity, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, description, quantity, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue);
    
    // Log initial creation
    const userIdentifier = req.user.username || req.user.rf || req.user.email;
    db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, status, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(result.lastInsertRowid, name, req.user.id, req.user.email || '', userIdentifier, 'recebimento', quantity, 'Cadastro Inicial', 'completed', unitValue);

    res.json({ id: result.lastInsertRowid });
  });

  app.delete('/api/items/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/inventory/action', authenticateToken, (req: any, res: any) => {
    const { itemId, type, quantity, destination, returnDeadline, unitValue } = req.body;
    const item: any = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const newQty = type === 'recebimento' ? item.quantity + quantity : item.quantity - quantity;
    if (newQty < 0) return res.status(400).json({ error: 'Insufficient stock' });

    const status = (type === 'retirada' && returnDeadline) ? 'active' : 'completed';
    const userIdentifier = req.user.username || req.user.rf || req.user.email;
    
    // If a new unitValue is provided during 'recebimento', use it. Otherwise, keep the old one.
    const finalUnitValue = (type === 'recebimento' && unitValue !== undefined && unitValue !== null && unitValue !== '') 
      ? Number(unitValue) 
      : item.unitValue;

    const transaction = db.transaction(() => {
      if (type === 'recebimento' && finalUnitValue !== item.unitValue) {
        db.prepare('UPDATE items SET quantity = ?, unitValue = ? WHERE id = ?').run(newQty, finalUnitValue, itemId);
      } else {
        db.prepare('UPDATE items SET quantity = ? WHERE id = ?').run(newQty, itemId);
      }
      db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, returnDeadline, status, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(itemId, item.name, req.user.id, req.user.email || '', userIdentifier, type, quantity, destination, returnDeadline, status, finalUnitValue);
    });
    transaction();

    res.json({ success: true });
  });

  // New endpoint for breakage
  app.post('/api/inventory/breakage', authenticateToken, (req: any, res: any) => {
    const { itemId, quantity, description } = req.body;
    const item: any = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const newQty = item.quantity - quantity;
    if (newQty < 0) return res.status(400).json({ error: 'Insufficient stock' });

    const userIdentifier = req.user.username || req.user.rf || req.user.email;

    const transaction = db.transaction(() => {
      db.prepare('UPDATE items SET quantity = ? WHERE id = ?').run(newQty, itemId);
      db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, status, isDamaged, damageDescription, isOperational, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(itemId, item.name, req.user.id, req.user.email || '', userIdentifier, 'quebra', quantity, 'Equipamento Quebrado', 'broken', 1, description, 0, item.unitValue);
    });
    transaction();

    res.json({ success: true });
  });

  // Loans Routes
  app.get('/api/loans', authenticateToken, (req: any, res: any) => {
    const loans = db.prepare("SELECT * FROM logs WHERE actionType = 'retirada' AND status = 'active' ORDER BY timestamp DESC").all();
    res.json(loans);
  });

  app.post('/api/loans/:id/return', authenticateToken, (req: any, res: any) => {
    const logId = req.params.id;
    const { isDamaged, damageDescription, isOperational } = req.body;
    const log: any = db.prepare("SELECT * FROM logs WHERE id = ? AND status = 'active'").get(logId);
    if (!log) return res.status(404).json({ error: 'Loan not found or already returned' });

    const item: any = db.prepare('SELECT * FROM items WHERE id = ?').get(log.itemId);
    const userIdentifier = req.user.username || req.user.rf || req.user.email;

    const transaction = db.transaction(() => {
      // Mark loan as returned
      db.prepare("UPDATE logs SET status = 'returned', returnDate = CURRENT_TIMESTAMP, isDamaged = ?, damageDescription = ?, isOperational = ? WHERE id = ?")
        .run(isDamaged ? 1 : 0, damageDescription || null, isOperational ? 1 : 0, logId);
      
      // Increment inventory ONLY if it's still operational
      if (isOperational) {
        db.prepare('UPDATE items SET quantity = quantity + ? WHERE id = ?').run(log.quantity, log.itemId);
      }
      
      // Create a new log for the return
      db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, status, isDamaged, damageDescription, isOperational, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(log.itemId, log.itemName, req.user.id, req.user.email || '', userIdentifier, 'recebimento', log.quantity, 'Devolução de Empréstimo', 'completed', isDamaged ? 1 : 0, damageDescription || null, isOperational ? 1 : 0, item.unitValue);
    });
    transaction();
    res.json({ success: true });
  });

  // Logs Routes
  app.get('/api/logs', authenticateToken, (req: any, res: any) => {
    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
    res.json(logs);
  });

  // Expenses Route
  app.get('/api/expenses', authenticateToken, (req: any, res: any) => {
    const { startDate, endDate } = req.query;
    // Only count 'recebimento' (acquisitions/purchases) as expenses.
    // Exclude 'Devolução de Empréstimo' since returning a loaned item is not a new purchase.
    let query = "SELECT * FROM logs WHERE actionType = 'recebimento' AND (destination IS NULL OR destination != 'Devolução de Empréstimo') AND unitValue IS NOT NULL";
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' AND timestamp BETWEEN ? AND ?';
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    query += ' ORDER BY timestamp DESC';
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  });

  // API 404 Handler - Must be after all API routes but before SPA fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

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
    category TEXT
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
    returnDeadline DATETIME
  );
`);

// Migrations
try { db.exec("ALTER TABLE items ADD COLUMN room TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN cabinet TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN shelf TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN imageUrl TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN minQuantity INTEGER;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN unitValue REAL;"); } catch (e) {}
try { db.exec("ALTER TABLE items ADD COLUMN active INTEGER DEFAULT 1;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN status TEXT DEFAULT 'completed';"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN returnDate DATETIME;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN rf TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN username TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN userIdentifier TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN observations TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE logs ADD COLUMN unitValue REAL;"); } catch (e) {}

// Seed Admin User
const seedAdmin = () => {
  const adminRf = '0000';
  const adminUsername = 'admin';
  const adminPassword = 'Hand|Of|God|@26';
  const existing = db.prepare('SELECT * FROM users WHERE rf = ? OR username = ?').get(adminRf, adminUsername);
  
  if (!existing) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO users (email, password, role, rf, username) VALUES (?, ?, ?, ?, ?)').run('admin@admin.com', hashedPassword, 'admin', adminRf, adminUsername);
    console.log('Admin user registered: admin / Hand|Of|God|@26');
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

  // ROTA CORRIGIDA: ATUALIZAR USUÁRIO
  app.put('/api/users/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const { rf, username, password, role } = req.body;
    const userId = req.params.id;

    try {
      if (password && password.trim() !== '') {
        // Se enviou senha, atualiza tudo incluindo a senha
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET rf = ?, username = ?, role = ?, password = ? WHERE id = ?')
          .run(rf, username, role || 'user', hashedPassword, userId);
      } else {
        // Se não enviou senha, atualiza apenas os outros dados
        db.prepare('UPDATE users SET rf = ?, username = ?, role = ? WHERE id = ?')
          .run(rf, username, role || 'user', userId);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'Erro ao atualizar usuário. O RF já pode estar em uso por outra pessoa.' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Inventory Routes
  app.get('/api/items', authenticateToken, (req: any, res: any) => {
    const items = db.prepare('SELECT * FROM items WHERE active = 1 OR active IS NULL').all();
    res.json(items);
  });

  app.post('/api/items', authenticateToken, (req: any, res: any) => {
    const { name, description, quantity, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue } = req.body;
    const result = db.prepare('INSERT INTO items (name, description, quantity, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)')
      .run(name, description, quantity, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue);
    
    if (quantity > 0) {
      const userIdentifier = req.user.username || req.user.rf || req.user.email;
      db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, status, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(result.lastInsertRowid, name, req.user.id, req.user.email || '', userIdentifier, 'recebimento', quantity, 'Cadastro Inicial', 'completed', unitValue || null);
    }
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/items/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, description, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue } = req.body;
    db.prepare('UPDATE items SET name=?, description=?, category=?, room=?, cabinet=?, shelf=?, imageUrl=?, minQuantity=?, unitValue=? WHERE id=?')
      .run(name, description, category, room, cabinet, shelf, imageUrl, minQuantity, unitValue, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/items/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const itemId = req.params.id;
    try {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM logs WHERE itemId = ?').run(itemId);
        db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
      });
      transaction();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao forçar a exclusão do item e seus dependentes.' });
    }
  });

  app.post('/api/inventory/action', authenticateToken, (req: any, res: any) => {
    const { itemId, type, quantity, destination, returnDeadline, observations, unitValue } = req.body;
    const item: any = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const isReduction = type === 'retirada' || type === 'quebra';
    const newQty = isReduction ? item.quantity - quantity : item.quantity + quantity;
    
    if (newQty < 0) return res.status(400).json({ error: 'Insufficient stock' });

    const status = (type === 'retirada' && returnDeadline) ? 'active' : 'completed';
    const userIdentifier = req.user.username || req.user.rf || req.user.email;

    const transaction = db.transaction(() => {
      if (unitValue !== null && unitValue !== undefined) {
         db.prepare('UPDATE items SET quantity = ?, unitValue = ? WHERE id = ?').run(newQty, unitValue, itemId);
      } else {
         db.prepare('UPDATE items SET quantity = ? WHERE id = ?').run(newQty, itemId);
      }
      
      db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, returnDeadline, status, observations, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(itemId, item.name, req.user.id, req.user.email || '', userIdentifier, type, quantity, destination, returnDeadline, status, observations || null, unitValue !== undefined ? unitValue : null);
    });
    transaction();

    res.json({ success: true });
  });

  // Expenses Routes
  app.get('/api/expenses', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const { startDate, endDate } = req.query;
    let query = "SELECT * FROM logs WHERE actionType = 'recebimento' AND unitValue IS NOT NULL AND unitValue > 0";
    const params: any[] = [];
    
    if (startDate) {
      query += " AND date(timestamp) >= date(?)";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND date(timestamp) <= date(?)";
      params.push(endDate);
    }
    
    query += " ORDER BY timestamp DESC";
    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  });

  // Loans Routes
  app.get('/api/loans', authenticateToken, (req: any, res: any) => {
    const loans = db.prepare("SELECT * FROM logs WHERE actionType = 'retirada' AND status = 'active' ORDER BY timestamp DESC").all();
    res.json(loans);
  });

  app.post('/api/loans/:id/return', authenticateToken, (req: any, res: any) => {
    const logId = req.params.id;
    const { observations, isBroken } = req.body || {};
    
    const log: any = db.prepare("SELECT * FROM logs WHERE id = ? AND status = 'active'").get(logId);
    if (!log) return res.status(404).json({ error: 'Loan not found or already returned' });

    const userIdentifier = req.user.username || req.user.rf || req.user.email;

    const transaction = db.transaction(() => {
      db.prepare("UPDATE logs SET status = 'returned', returnDate = CURRENT_TIMESTAMP WHERE id = ?").run(logId);
      
      if (isBroken) {
        db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, status, observations, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)')
          .run(log.itemId, log.itemName, req.user.id, req.user.email || '', userIdentifier, 'quebra', log.quantity, 'Baixa por Quebra na Devolução', 'completed', observations || null);
      } else {
        db.prepare('UPDATE items SET quantity = quantity + ? WHERE id = ?').run(log.quantity, log.itemId);
        db.prepare('INSERT INTO logs (itemId, itemName, userId, userEmail, userIdentifier, actionType, quantity, destination, status, observations, unitValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)')
          .run(log.itemId, log.itemName, req.user.id, req.user.email || '', userIdentifier, 'recebimento', log.quantity, 'Devolução de Empréstimo', 'completed', observations || null);
      }
    });
    transaction();
    res.json({ success: true });
  });

  // Logs Routes
  app.get('/api/logs', authenticateToken, (req: any, res: any) => {
    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
    res.json(logs);
  });

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
  // ROTA PARA ATUALIZAR O PRÓPRIO PERFIL (Usada pelo ProfileModal.tsx)
  app.put('/api/users/me', authenticateToken, (req: any, res: any) => {
    const userId = req.user.id;
    const { username, currentPassword, newPassword } = req.body;

    try {
      // Cenário 1: Atualização apenas do nome
      if (!currentPassword && !newPassword) {
        db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, userId);
      } 
      // Cenário 2: Atualização de Senha
      else if (currentPassword && newPassword) {
        const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        
        if (!bcrypt.compareSync(currentPassword, user.password)) {
          return res.status(400).json({ error: 'Senha atual incorreta' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE users SET username = ?, password = ? WHERE id = ?')
          .run(username || user.username, hashedPassword, userId);
      }

      // Após a atualização, precisamos gerar um novo token com os dados atualizados
      const updatedUser: any = db.prepare('SELECT id, rf, username, role FROM users WHERE id = ?').get(userId);
      const token = jwt.sign(updatedUser, JWT_SECRET);

      res.json({ success: true, token, user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro interno ao atualizar perfil.' });
    }
  });
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
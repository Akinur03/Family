import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from './server/store';

const app = express();
const PORT = 3000;

// Ensure public uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `receipt-${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'application/pdf'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve uploads statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple auth helper from Bearer token
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('token-')) {
    const userId = token.replace('token-', '');
    return db.findUserById(userId);
  }
  return null;
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'KinFinance Backend API', time: new Date().toISOString() });
});

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response): any => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please check your username or register.' });
  }

  if (user.passwordHash !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  // Check user status
  if (user.status === 'pending') {
    return res.status(403).json({
      error: 'Account Pending Approval',
      status: 'pending',
      message: 'Your registration is pending approval by the Family Head. You will be able to log in as soon as an administrator approves your account.',
    });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({
      error: 'Account Rejected',
      status: 'rejected',
      message: user.rejectionReason || 'Your family account registration was declined by the administrator.',
    });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json({
    token: `token-${user.id}`,
    user: safeUser,
  });
});

// Auth: Register (New accounts default to 'pending' unless first user)
app.post('/api/auth/register', (req: Request, res: Response): any => {
  const { username, password, fullName, relationship, avatarUrl } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Username, password, and full name are required' });
  }

  if (db.findUserByUsername(username)) {
    return res.status(400).json({ error: 'Username already taken. Please pick another one.' });
  }

  const { user, isAutoApproved } = db.registerUser({
    username: username.trim(),
    passwordHash: password,
    fullName: fullName.trim(),
    relationship: relationship || 'Family Member',
    avatarUrl,
  });

  return res.status(201).json({
    message: isAutoApproved
      ? 'Initial Family Head account created and activated!'
      : 'Registration submitted successfully! Your account is in Pending status and will be accessible once approved by the Family Head.',
    user,
    isPending: user.status === 'pending',
    token: isAutoApproved ? `token-${user.id}` : null,
  });
});

// Auth: Current user
app.get('/api/auth/me', (req: Request, res: Response): any => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// Demo switch helper
app.post('/api/auth/demo-switch', (req: Request, res: Response): any => {
  const { username } = req.body;
  const user = db.findUserByUsername(username);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }
  const { passwordHash, ...safeUser } = user;
  return res.json({
    token: `token-${user.id}`,
    user: safeUser,
  });
});

// Users: Get all (Admin full access or family directory summary)
app.get('/api/users', (req: Request, res: Response): any => {
  const users = db.getUsers();
  return res.json({ users });
});

// Users: Update status (Approve / Reject / Suspend) - Admin only
app.patch('/api/users/:id/status', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only Family Head (Admin) can approve or reject accounts' });
  }

  const { status, rejectionReason } = req.body;
  if (!['active', 'pending', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const updatedUser = db.updateUserStatus(req.params.id, status, authUser.fullName, rejectionReason);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ message: `User status updated to ${status}`, user: updatedUser });
});

// Users: Update role (Admin / Member)
app.patch('/api/users/:id/role', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only Family Head (Admin) can change user roles' });
  }

  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role value' });
  }

  const updatedUser = db.updateUserRole(req.params.id, role);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ message: `User role updated to ${role}`, user: updatedUser });
});

// Categories: Get all
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({ categories: db.getCategories() });
});

// Categories: Create custom category
app.post('/api/categories', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  const { name, type, icon, color, description, monthlyBudget } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const newCat = db.addCategory({
    name: name.trim(),
    type: type || 'expense',
    icon: icon || 'Tag',
    color: color || '#10b981',
    description: description || '',
    monthlyBudget: Number(monthlyBudget) || 0,
    createdBy: authUser ? authUser.id : undefined,
  });

  return res.status(201).json({ category: newCat });
});

// Upload: Receipt / Document upload
app.post('/api/upload', upload.single('receipt'), (req: Request, res: Response): any => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    url: fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });
});

// Base64 upload fallback for web paste / drag
app.post('/api/upload/base64', (req: Request, res: Response): any => {
  const { base64Data, fileName, mimeType } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: 'base64Data is required' });
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
    const safeExt = fileName ? path.extname(fileName) : '.png';
    const uniqueFilename = `receipt-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt || '.png'}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    return res.json({
      url: `/uploads/${uniqueFilename}`,
      fileName: fileName || uniqueFilename,
      fileSize: buffer.length,
      mimeType: mimeType || 'image/png',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save base64 image: ' + err.message });
  }
});

// Transactions: Get
app.get('/api/transactions', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  const { status, categoryId, memberId, type, search, startDate, endDate, personalOnly } = req.query;

  let targetUserId: string | undefined = undefined;
  if (personalOnly === 'true' && authUser) {
    targetUserId = authUser.id;
  } else if (memberId && memberId !== 'all') {
    targetUserId = String(memberId);
  }

  const txs = db.getTransactions({
    userId: targetUserId,
    status: status ? String(status) : undefined,
    categoryId: categoryId ? String(categoryId) : undefined,
    type: type ? String(type) : undefined,
    search: search ? String(search) : undefined,
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
  });

  return res.json({ transactions: txs });
});

// Transactions: Create (Starts as 'pending')
app.post('/api/transactions', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { title, amount, type, categoryId, date, notes, receiptUrl, receiptFileName, receiptFileSize } = req.body;

  if (!title || !amount || !categoryId) {
    return res.status(400).json({ error: 'Title, amount, and category are required' });
  }

  const category = db.getCategories().find(c => c.id === categoryId);
  if (!category) {
    return res.status(400).json({ error: 'Selected category does not exist' });
  }

  const tx = db.createTransaction({
    userId: authUser.id,
    userName: authUser.fullName,
    userRole: authUser.role,
    title: title.trim(),
    amount: Math.abs(Number(amount)),
    type: (type as 'expense' | 'income') || 'expense',
    categoryId,
    categoryName: category.name,
    categoryColor: category.color,
    categoryIcon: category.icon,
    date: date || new Date().toISOString().split('T')[0],
    notes: notes ? notes.trim() : '',
    receiptUrl,
    receiptFileName,
    receiptFileSize: receiptFileSize ? Number(receiptFileSize) : undefined,
  });

  return res.status(201).json({
    message: 'Transaction submitted and placed in Pending review.',
    transaction: tx,
  });
});

// Transactions: Update (Member can update if pending or rejected; Admin can update anytime)
app.put('/api/transactions/:id', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const existingTx = db.getTransactionById(req.params.id);
  if (!existingTx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const isOwner = existingTx.userId === authUser.id;
  const isAdmin = authUser.role === 'admin';

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: 'You do not have permission to edit this transaction' });
  }

  if (!isAdmin && isOwner && existingTx.status === 'approved') {
    return res.status(400).json({ error: 'Approved transactions cannot be modified by members. Contact the Family Head.' });
  }

  const updates: any = {};
  if (req.body.title) updates.title = req.body.title.trim();
  if (req.body.amount) updates.amount = Math.abs(Number(req.body.amount));
  if (req.body.type) updates.type = req.body.type;
  if (req.body.date) updates.date = req.body.date;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.receiptUrl !== undefined) {
    updates.receiptUrl = req.body.receiptUrl;
    updates.receiptFileName = req.body.receiptFileName;
    updates.receiptFileSize = req.body.receiptFileSize;
  }

  if (req.body.categoryId) {
    const category = db.getCategories().find(c => c.id === req.body.categoryId);
    if (category) {
      updates.categoryId = category.id;
      updates.categoryName = category.name;
      updates.categoryColor = category.color;
      updates.categoryIcon = category.icon;
    }
  }

  // If member re-submitted a rejected transaction, set it back to pending for re-review!
  if (!isAdmin && existingTx.status === 'rejected') {
    existingTx.status = 'pending';
    existingTx.reviewNotes = 'Re-submitted by member for review.';
  }

  const updatedTx = db.updateTransaction(req.params.id, updates);
  return res.json({ message: 'Transaction updated successfully', transaction: updatedTx });
});

// Transactions: Admin Review (Approve or Reject with review notes)
app.post('/api/transactions/:id/review', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only Family Head (Admin) can approve or reject transactions' });
  }

  const { status, reviewNotes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  const reviewedTx = db.reviewTransaction(
    req.params.id,
    status as 'approved' | 'rejected',
    authUser.id,
    authUser.fullName,
    reviewNotes
  );

  if (!reviewedTx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  return res.json({
    message: `Transaction has been marked as ${status}.`,
    transaction: reviewedTx,
  });
});

// Transactions: Delete
app.delete('/api/transactions/:id', (req: Request, res: Response): any => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const existingTx = db.getTransactionById(req.params.id);
  if (!existingTx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const isOwner = existingTx.userId === authUser.id;
  const isAdmin = authUser.role === 'admin';

  if (!isAdmin && (!isOwner || existingTx.status === 'approved')) {
    return res.status(403).json({ error: 'You do not have permission to delete this transaction' });
  }

  db.deleteTransaction(req.params.id);
  return res.json({ message: 'Transaction removed successfully' });
});

// Reports: Consolidated financial analytics
app.get('/api/reports/summary', (_req: Request, res: Response) => {
  const summary = db.getFinancialSummary();
  res.json(summary);
});

// Demo: Seed reset
app.post('/api/demo/reset', (_req: Request, res: Response) => {
  db.resetToDefaults();
  res.json({ message: 'Database reset to default seed data' });
});

// Start server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KinFinance server running on port ${PORT}`);
  });
}

startServer();

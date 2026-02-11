import express from 'express';
import inventoryImports from './routes/inventoryImports';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use('/api', inventoryImports);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import env from './config/env';

const createApp = (): express.Express => {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.use('/api', apiRoutes);

  // Serve static files from React build in production/Electron
  if (env.nodeEnv === 'production' || process.env.ELECTRON === 'true') {
    const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
    app.use(express.static(clientDistPath));
    
    // All non-API routes serve the React app
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
};

export default createApp;

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
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

  app.use(errorHandler);

  return app;
};

export default createApp;

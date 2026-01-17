import connectDB from './config/database';
import env from './config/env';
import createApp from './app';

const app = createApp();

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

void startServer();

export default app;

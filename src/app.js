import express from 'express';
import logger from '#config/loggers.js';

const app = express();

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions!');
  res.status(200).send('Hello from Acquisitions!');
});

export default app;


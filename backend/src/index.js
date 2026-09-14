const app = require("./app");
const { initRabbitMQ } = require("./utils/rabbitmq");
const { startSyncWorker } = require("./workers/sync-worker");

const port = Number(process.env.PORT || 3001);

app.listen(port, async () => {
  console.log(`Backend API running at http://localhost:${port}`);
  
  // Initialize RabbitMQ connection and queues
  await initRabbitMQ();
  
  // Start background worker for syncing
  startSyncWorker();
});

const amqp = require("amqplib");

let channel = null;

async function initRabbitMQ() {
  try {
    // Connect to RabbitMQ using environment variable or localhost fallback
    // When running in Docker, RABBITMQ_URL is provided in docker-compose.yml
    const amqpUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    console.log(`[RabbitMQ] Connecting to ${amqpUrl}`);
    const connection = await amqp.connect(amqpUrl);
    channel = await connection.createChannel();

    // Declare necessary queues
    await channel.assertQueue("master_data_sync", { durable: true });
    await channel.assertQueue("transaction_sync", { durable: true });
    await channel.assertQueue("inventory_transfer", { durable: true });

    console.log("[RabbitMQ] Connected and queues asserted successfully.");
  } catch (error) {
    console.error("[RabbitMQ] Failed to connect:", error.message);
    // In production, you might want to retry connection or exit
  }
}

/**
 * Publishes an event to a RabbitMQ queue
 * @param {string} queueName - The name of the queue (e.g., master_data_sync, transaction_sync)
 * @param {Object} payload - The data to send, including event type (e.g., { event: 'product.created', data: {...} })
 */
async function publishEvent(queueName, payload) {
  if (!channel) {
    console.warn("[RabbitMQ] Channel not initialized. Message not sent:", payload);
    return false;
  }
  try {
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const success = channel.sendToQueue(queueName, messageBuffer, { persistent: true });
    if (success) {
      console.log(`[RabbitMQ] Published event '${payload.event}' to '${queueName}'`);
    } else {
      console.warn(`[RabbitMQ] Failed to push event '${payload.event}' to '${queueName}'`);
    }
    return success;
  } catch (error) {
    console.error("[RabbitMQ] Publish error:", error.message);
    return false;
  }
}

function getChannel() {
  return channel;
}

module.exports = {
  initRabbitMQ,
  publishEvent,
  getChannel
};

'use strict';

require('dotenv').config();
const Fastify = require('fastify');

async function startServer() {
  const fastify = Fastify({
    logger: true,
    trustProxy: true
  });

  // Register plugins
  await fastify.register(require('./src/plugins/cors'));
  await fastify.register(require('./src/plugins/swagger'));
  await fastify.register(require('./src/plugins/postgres'));
  await fastify.register(require('./src/plugins/auth'));

  // Register routes
  await fastify.register(require('./src/routes'));

  // Health check route
  fastify.get('/health', async () => {
    return { status: 'API is running', db: fastify.pg ? 'Connected' : 'Not connected' };
  });

  // Run the server
  try {
    const PORT = process.env.API_PORT || 4000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Server is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
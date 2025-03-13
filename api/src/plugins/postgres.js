'use strict';

const fp = require('fastify-plugin');
const { Pool } = require('pg');

module.exports = fp(async function(fastify, opts) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Additional options if needed
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test the connection
  try {
    const client = await pool.connect();
    fastify.log.info('PostgreSQL connection established');
    client.release();
  } catch (err) {
    fastify.log.error('PostgreSQL connection error:', err);
    throw err;
  }

  // Make the pool available through the fastify instance
  fastify.decorate('pg', {
    pool,
    async query(text, params) {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      fastify.log.debug(`Executed query: ${text} - ${duration}ms`);
      return result;
    },
    async getClient() {
      const client = await pool.connect();
      const release = client.release;
      // Override client release to keep track of released clients
      client.release = () => {
        release.apply(client);
        fastify.log.debug('Client released back to pool');
      };
      return client;
    }
  });

  // Close pool on fastify close
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Closing PostgreSQL pool');
    await pool.end();
  });
});
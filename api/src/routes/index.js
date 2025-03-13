'use strict';

module.exports = async function(fastify, opts) {
  // Register all route groups
  fastify.register(require('./users'), { prefix: '/users' });
  // Add more route groups as needed
};
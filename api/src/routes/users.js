'use strict';

module.exports = async function(fastify, opts) {
  const routes = [
    {
      method: 'GET',
      url: '/',
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      },
      preHandler: fastify.authenticate,
      handler: async (request, reply) => {
        const result = await fastify.pg.query('SELECT id, name, email FROM users');
        return result.rows;
      }
    },
    {
      method: 'GET',
      url: '/:id',
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      },
      preHandler: fastify.authenticate,
      handler: async (request, reply) => {
        const { id } = request.params;
        const result = await fastify.pg.query(
          'SELECT id, name, email FROM users WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }
        
        return result.rows[0];
      }
    }
  ];
  
  routes.forEach(route => {
    fastify.route(route);
  });
};
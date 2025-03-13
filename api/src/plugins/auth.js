'use strict';

const fp = require('fastify-plugin');
const { OAuth2Client } = require('google-auth-library');

module.exports = fp(async function(fastify, opts) {
  // Register JWT
  fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    sign: {
      expiresIn: '7d'
    }
  });

  // Register cookie
  fastify.register(require('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'another-secret-key-change-in-production',
    hook: 'onRequest',
    parseOptions: {}
  });

  // Google OAuth client
  const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  // Decorate fastify with authenticate utility
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      // Check for JWT token in authorization header or cookie
      const token = request.headers.authorization
        ? request.headers.authorization.replace('Bearer ', '')
        : request.cookies.token;

      if (!token) {
        throw new Error('No token found');
      }

      // Verify JWT token
      const decoded = await fastify.jwt.verify(token);
      request.user = decoded;
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Google sign-in verification
  fastify.decorate('verifyGoogleToken', async function(token) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      return {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } catch (err) {
      throw new Error('Invalid Google token');
    }
  });

  // Register auth routes
  fastify.post('/auth/google', async (request, reply) => {
    try {
      const { token } = request.body;
      
      if (!token) {
        return reply.code(400).send({ error: 'Token is required' });
      }
      
      // Verify Google token
      const userData = await fastify.verifyGoogleToken(token);
      
      // Check if user exists in database
      const userResult = await fastify.pg.query(
        'SELECT * FROM users WHERE google_id = $1',
        [userData.userId]
      );
      
      let user;
      
      if (userResult.rows.length === 0) {
        // Create new user
        const newUserResult = await fastify.pg.query(
          'INSERT INTO users(google_id, email, name, picture) VALUES($1, $2, $3, $4) RETURNING *',
          [userData.userId, userData.email, userData.name, userData.picture]
        );
        user = newUserResult.rows[0];
      } else {
        user = userResult.rows[0];
        
        // Update user data if needed
        await fastify.pg.query(
          'UPDATE users SET email = $1, name = $2, picture = $3, last_login = NOW() WHERE google_id = $4',
          [userData.email, userData.name, userData.picture, userData.userId]
        );
      }
      
      // Generate JWT token
      const jwtToken = await fastify.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name
      });
      
      // Set cookie
      reply.setCookie('token', jwtToken, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      });
      
      return { token: jwtToken, user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
      request.log.error(error);
      return reply.code(401).send({ error: 'Authentication failed' });
    }
  });

  // Logout route
  fastify.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { success: true };
  });

  // User info route (protected)
  fastify.get('/auth/user', { preHandler: fastify.authenticate }, async (request, reply) => {
    return { user: request.user };
  });
});
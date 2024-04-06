import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function usersRoutes(app: FastifyInstance) {
  // cadastro do usuario
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
    })

    const { name, email, password } = createUserBodySchema.parse(request.body)

    // cria o sessionId para logar direto apos o cadastro
    const sessionId = randomUUID()
    reply.cookie('session_id', sessionId, {
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })

    await knex('users').insert({
      id: randomUUID(),
      name,
      password,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send('Usuario cadastrado com sucesso!')
  })
}

import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function loginRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createLoginBodySchema = z.object({
      email: z.string(),
      password: z.string(),
    })

    const { email, password } = createLoginBodySchema.parse(request.body)

    const user = await knex('users')
      .select('*')
      .where({ email, password })
      .first()

    if (!user) {
      return reply.status(401).send('Erro ao enviar o email ou a senha')
    }

    // criando um novo sessionId
    const sessionId = randomUUID()
    reply.cookie('session_id', sessionId, {
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })

    await knex('users')
      .update({
        session_id: sessionId,
      })
      .where({ id: user.id })

    return reply.status(200).send('Login realizado com sucesso!')
  })
}

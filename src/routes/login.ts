import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function loginRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  app.post('/', async (request, reply) => {
    if (request.cookies.session_id) {
      return reply.status(401).send('Usuário já se encontra logado')
    }

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

  app.delete('/', async (request, reply) => {
    const sessionId = request.cookies.session_id

    if (!sessionId) {
      return reply.status(401).send('Nenhum usuário logado')
    }

    await knex('users')
      .update({
        session_id: '',
      })
      .where({ session_id: sessionId })

    reply.clearCookie('session_id', { path: '/' })

    return reply.status(200).send('Logout realizado com sucesso!')
  })
}

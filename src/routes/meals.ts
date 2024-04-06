import { FastifyInstance, FastifyRequest } from 'fastify'
import { checkSessionIdExist } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  interface CustomRequest extends FastifyRequest {
    userId?: string
  }

  app.addHook('preHandler', async (request: CustomRequest, reply) => {
    console.log(`[${request.method}] ${request.url}`)

    await checkSessionIdExist(request, reply)

    const user = await knex('users')
      .select('id')
      .where({
        session_id: request.cookies.session_id,
      })
      .first()

    if (user) {
      request.userId = user.id
    }
  })

  app.post(
    '/',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        onDiet: z.boolean(),
        date: z.string(),
      })

      const { name, description, onDiet, date } = createMealBodySchema.parse(
        request.body,
      )

      const _date = new Date(date)

      if (isNaN(_date.getTime())) {
        return reply.status(400).send('formato da data inválido')
      }

      const dateTimeFormatted = `${_date.getFullYear()}-${_date.getMonth()}-${_date.getDate()} ${_date.getUTCHours()}:${_date.getUTCMinutes()}:${_date.getUTCSeconds()}`

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        on_diet: onDiet,
        date: dateTimeFormatted,
        user_id: request.userId,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const meals = await knex('meals')
        .select('*')
        .where({ user_id: request.userId })

      if (meals.length === 0) {
        return reply.status(404).send('Nenhuma refeição encontrada')
      }

      return reply.send(meals)
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const createMealParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = createMealParamsSchema.parse(request.params)

      const meals = await knex('meals')
        .select('*')
        .where({ id, user_id: request.userId })

      if (meals.length === 0) {
        return reply.status(404).send('Nenhuma refeição encontrada')
      }

      return reply.send(meals)
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const createMealParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = createMealParamsSchema.parse(request.params)

      await knex('meals').delete().where({ id, user_id: request.userId })

      return reply.status(204).send('Refeição deletada com sucesso!')
    },
  )

  app.patch(
    '/:id',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const createMealParamsSchema = z.object({
        id: z.string(),
      })

      const createMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        onDiet: z.boolean().optional(),
        date: z.string().optional(),
      })

      const { name, description, onDiet, date } = createMealBodySchema.parse(
        request.body,
      )

      const { id } = createMealParamsSchema.parse(request.params)

      await knex('meals')
        .update({
          name,
          description,
          on_diet: onDiet,
          date,
        })
        .where({ id, user_id: request.userId })

      return reply.status(204).send()
    },
  )

  app.get(
    '/quantity',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const meals = await knex('meals')
        .count('* as quantity')
        .where({ user_id: request.userId })
        .first()

      return reply.send(meals)
    },
  )

  app.get(
    '/quantity/diets',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const meals = await knex('meals')
        .count('* as quantity')
        .where({ user_id: request.userId, on_diet: true })
        .first()

      return reply.send(meals)
    },
  )

  app.get(
    '/quantity/free',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const meals = await knex('meals')
        .count('* as quantity')
        .where({ user_id: request.userId, on_diet: false })
        .first()

      return reply.send(meals)
    },
  )

  app.get(
    '/quantity/diets/streak',
    { preHandler: [checkSessionIdExist] },
    async (request: CustomRequest, reply) => {
      const meals = await knex('meals')
        .select('date', 'on_diet')
        .where({ user_id: request.userId })
        .orderBy('date')

      if (meals.length === 0) {
        return reply.send({ streak: 0 })
      }

      let streak = 0
      let aux = 0
      meals.forEach((meal) => {
        if (meal.on_diet) {
          aux++
          if (aux > streak) {
            streak = aux
          }
        }

        if (!meal.on_diet) {
          aux = 0
        }
      })

      return reply.send({ streak })
    },
  )
}

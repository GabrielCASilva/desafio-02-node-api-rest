import { beforeAll, afterAll, describe, it, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'

describe('Meals Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run migrate:rollback -- --all')
    execSync('npm run migrate:latest')
  })

  it('should be able to user post their meals', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@mail.com',
        password: '123456',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie') || []

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Banana',
        description: 'Lanche da tarde',
        onDiet: true,
        date: '2024-08-13 10:25:55',
      })
      .expect(201)
  })
})

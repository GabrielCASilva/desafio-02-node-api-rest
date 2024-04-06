import { beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'

describe('Login Routes', () => {
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

  it('should be able to logout a user', async () => {
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
      .delete('/login')
      .set('Cookie', cookies)
      .expect(200)
  })

  it('should be abre to login a user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'johndoe@mail.com',
        password: '123456',
      })
      .expect(201)

    await request(app.server)
      .post('/login')
      .send({ email: 'johndoe@mail.com', password: '123456' })
      .expect(200)
  })
})

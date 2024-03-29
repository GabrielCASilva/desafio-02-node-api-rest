import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meal', (table) => {
    table.uuid('id').primary()
    table.text('name').notNullable()
    table.text('description').notNullable()
    table.text('on_diet').notNullable()
    table.date('date')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.uuid('user_id').references('id').inTable('users')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meal')
}

import Hapi from '@hapi/hapi'
import mysql from 'mysql2/promise'

const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory'
})

const server = Hapi.server({
  port: 9000,
  host: 'localhost'
})

server.route({
  method: 'GET',
  path: '/inventory/summary/{nim}',
  handler: async (request, h) => {
    const { category, start, end } = request.query
    const t1 = Date.now()

    const queryBefore = `
      SELECT p.category,
             SUM(p.stock) AS total_stock,
             SUM(CASE WHEN t.transaction_type = 'in' THEN t.qty ELSE 0 END) AS total_in,
             SUM(CASE WHEN t.transaction_type = 'out' THEN t.qty ELSE 0 END) AS total_out,
             SUM(t.qty * p.price) AS total_value
      FROM products p
      JOIN transactions t ON p.id = t.product_id
      WHERE DATE(t.created_at) BETWEEN '${start}' AND '${end}'
      ${category ? `AND p.category = '${category}'` : ''}
      GROUP BY p.category
    `
    const [beforeResult] = await db.query(queryBefore)
    const t2 = Date.now()

    const queryAfter = `
      SELECT p.category,
             SUM(p.stock) AS total_stock,
             SUM(CASE WHEN t.transaction_type = 'in' THEN t.qty ELSE 0 END) AS total_in,
             SUM(CASE WHEN t.transaction_type = 'out' THEN t.qty ELSE 0 END) AS total_out,
             SUM(t.qty * p.price) AS total_value
      FROM products p
      JOIN transactions t ON p.id = t.product_id
      WHERE t.created_at BETWEEN ? AND ?
      ${category ? 'AND p.category = ?' : ''}
      GROUP BY p.category
    `
    const params = category ? [start, end, category] : [start, end]
    const [afterResult] = await db.query(queryAfter, params)
    const t3 = Date.now()

    return h.response({
      nim: request.params.nim,
      category: category || 'All',
      start,
      end,
      before: {
        execution_time_ms: t2 - t1,
        result: beforeResult
      },
      after: {
        execution_time_ms: t3 - t2,
        result: afterResult
      }
    })
  }
})

const init = async () => {
  await server.start()
  console.log('Server running on', server.info.uri)
}

init()

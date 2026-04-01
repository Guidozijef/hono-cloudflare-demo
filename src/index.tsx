import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'
import { renderer } from './renderer'

// 1. 定义环境变量类型
type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}


const app = new Hono<{ Bindings: Bindings }>()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Hello World!</h1>)
})

app.get('/get', (c) => {
  return c.json({ message: 'Hello World!', code: 200 })
})


// --- 鉴权中间件 ---
const JWT_SECRET = 'your-secret-key' // 实际建议从 c.env.JWT_SECRET 获取
app.use('/api/*', jwt({ secret: JWT_SECRET, alg: 'HS256' }))

// --- 基础测试接口 ---
app.get('/', (c) => c.text('Hono + D1 API is Online!'))

// --- 1. 登录 (为了拿 Token) ---
app.post('/login', async (c) => {
  const { username } = await c.req.json()
  // 模拟登录，直接发放 Token
  const token = await sign({ username, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET)
  return c.json({ token })
})

// --- 2. 增删改查接口 (API 模块) ---

// 【增】：添加任务
app.post('/api/todos', async (c) => {
  const { title } = await c.req.json()
  // 使用 prepare 和 bind 防止 SQL 注入
  const result = await c.env.DB.prepare(
    'INSERT INTO todos (title, status) VALUES (?, ?)'
  ).bind(title, 0).run()
  
  return c.json({ success: true, id: result.meta.last_row_id }, 201)
})

// 【查】：获取列表
app.get('/api/todos', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM todos').all()
  return c.json(results)
})

// 【改】：更新任务状态
app.put('/api/todos/:id', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json()
  
  await c.env.DB.prepare(
    'UPDATE todos SET status = ? WHERE id = ?'
  ).bind(status, id).run()
  
  return c.json({ success: true })
})

// 【删】：删除任务
app.delete('/api/todos/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

export default app
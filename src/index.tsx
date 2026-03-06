import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Hello World!</h1>)
})

app.get('/get', (c) => {
  return c.json({ message: 'Hello World!', code: 200 })
})

export default app

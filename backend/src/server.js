const express = require('express')
const cors    = require('cors')
const client  = require('prom-client')

const app      = express()
const register = new client.Registry()
client.collectDefaultMetrics({ register })

// ── Metrics ───────────────────────────────────────────────────────────────
const httpReqs = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
})
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1],
  registers: [register],
})

app.use(cors())
app.use(express.json())

// ── Middleware: track all requests ────────────────────────────────────────
app.use((req, res, next) => {
  const end = httpDuration.startTimer({ method: req.method, route: req.path })
  res.on('finish', () => {
    httpReqs.inc({ method: req.method, route: req.path, status: res.statusCode })
    end()
  })
  next()
})

// ── In-memory data (no DB needed for practice) ────────────────────────────
const products = [
  { id: 1, name: "Wireless Headphones",  price: 99.99,  category: "Electronics", stock: 50,  image: "🎧", rating: 4.5, reviews: 128 },
  { id: 2, name: "Running Shoes",        price: 79.99,  category: "Sports",      stock: 30,  image: "👟", rating: 4.3, reviews: 89  },
  { id: 3, name: "Coffee Maker",         price: 49.99,  category: "Kitchen",     stock: 20,  image: "☕", rating: 4.7, reviews: 256 },
  { id: 4, name: "Backpack",             price: 39.99,  category: "Bags",        stock: 45,  image: "🎒", rating: 4.2, reviews: 67  },
  { id: 5, name: "Sunglasses",           price: 29.99,  category: "Fashion",     stock: 60,  image: "🕶️", rating: 4.4, reviews: 43  },
  { id: 6, name: "Yoga Mat",             price: 24.99,  category: "Sports",      stock: 35,  image: "🧘", rating: 4.6, reviews: 112 },
  { id: 7, name: "Desk Lamp",            price: 34.99,  category: "Electronics", stock: 25,  image: "💡", rating: 4.1, reviews: 55  },
  { id: 8, name: "Water Bottle",         price: 19.99,  category: "Sports",      stock: 80,  image: "🍶", rating: 4.8, reviews: 340 },
]

let orders = []
let orderIdCounter = 1000

// ── Routes ────────────────────────────────────────────────────────────────

// Health + Ready
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }))
app.get('/ready',  (req, res) => res.json({ status: 'ready' }))

// Products
app.get('/api/products', (req, res) => {
  const { category, search } = req.query
  let result = products
  if (category) result = result.filter(p => p.category === category)
  if (search)   result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  res.json(result)
})

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id))
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

// Categories
app.get('/api/categories', (req, res) => {
  const cats = [...new Set(products.map(p => p.category))]
  res.json(cats)
})

// Orders
app.post('/api/orders', (req, res) => {
  const { items, customerName, email, address } = req.body
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' })
  }
  const total = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

  const order = {
    id: orderIdCounter++,
    items,
    customerName,
    email,
    address,
    total: total.toFixed(2),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }
  orders.push(order)
  res.status(201).json(order)
})

app.get('/api/orders', (req, res) => res.json(orders))

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json(order)
})

// Stats for dashboard
app.get('/api/stats', (req, res) => {
  res.json({
    totalProducts: products.length,
    totalOrders:   orders.length,
    totalRevenue:  orders.reduce((sum, o) => sum + parseFloat(o.total), 0).toFixed(2),
    version:       process.env.APP_VERSION || '1.0.0',
    environment:   process.env.NODE_ENV || 'production',
  })
})

// Prometheus metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))

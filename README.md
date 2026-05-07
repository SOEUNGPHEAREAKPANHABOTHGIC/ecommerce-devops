# LuxeMart — E-Commerce DevOps Project

Full e-commerce app with React frontend + Node.js backend deployed via Jenkins CI/CD pipeline on Kubernetes.

## What this project has

- **Frontend** — React app: product listing, cart, checkout, order history
- **Backend** — Node.js Express API: products, orders, /metrics endpoint
- **CI/CD** — Jenkins pipeline: test → build → Trivy scan → Docker Hub → K8s deploy
- **Monitoring** — Prometheus scrapes /metrics, Grafana dashboards

## Architecture

```
GitHub push → Jenkins webhook
              ↓
           Test (npm test)
              ↓
           Build (docker build × 2)
              ↓
           Scan (Trivy security scan)
              ↓
           Push (Docker Hub)
              ↓
           Deploy (kubectl set image)
              ↓
         Kubernetes cluster
         ├── ecommerce-frontend  → NodePort 30080
         └── ecommerce-backend   → NodePort 30081
```

## Before you start — replace these values

| File | Find | Replace with |
|---|---|---|
| `Jenkinsfile` | `REPLACE_YOUR_DOCKERHUB_USERNAME` | Your Docker Hub username |
| `Jenkinsfile` | `REPLACE_WORKER_IP` | Your k8s-worker public IP |
| `frontend/src/App.jsx` | `REPLACE_WORKER_IP` | Your k8s-worker public IP |
| `k8s/deployment.yaml` | `REPLACE_DOCKERHUB_USER` | Your Docker Hub username |

## Access after deploy

| Service | URL |
|---|---|
| Frontend (shop) | http://\<worker-ip\>:30080 |
| Backend API | http://\<worker-ip\>:30081/api/products |
| Health check | http://\<worker-ip\>:30081/health |
| Metrics | http://\<worker-ip\>:30081/metrics |

## API Endpoints

```
GET  /api/products          — list all products
GET  /api/products?search=x — search products
GET  /api/products?category=Electronics
GET  /api/categories        — list all categories
GET  /api/stats             — total products, orders, revenue
POST /api/orders            — place an order
GET  /api/orders            — list all orders
GET  /health                — liveness check
GET  /metrics               — Prometheus metrics
```

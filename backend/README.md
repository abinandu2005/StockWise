# StockWise Backend — Spring Boot Microservices

Production-ready backend for **StockWise Inventory Management System** using Java 21 + Spring Boot 3 Microservices Architecture.

## Architecture

```
Client → API Gateway (9090)
             ↓
    ┌─────────────────────────────────────────────────┐
    │  auth-service      :8081  (MySQL + JPA)         │
    │  inventory-service :8082  (MongoDB)             │
    │  supplier-customer :8083  (MongoDB)             │
    │  purchase-order    :8084  (MongoDB + Feign)     │
    │  sales-dispatch    :8085  (MongoDB + Feign)     │
    │  analytics-reports :8086  (MongoDB)             │
    └─────────────────────────────────────────────────┘
```

## Quick Start (Docker)

```bash
cd backend

# 1. Copy and configure environment variables
cp .env.example .env

# 2. Start everything
docker-compose up --build -d

# 3. Check services
docker-compose ps
```

## Quick Start (Local Development)

**Prerequisites:** Java 21, Maven 3.9+, MySQL 8, MongoDB 7

```bash
# 1. Start MySQL and MongoDB locally

# 2. Start API Gateway
cd api-gateway && mvn spring-boot:run

# 4. Start all microservices (each in separate terminal)
cd auth-service && mvn spring-boot:run
cd inventory-service && mvn spring-boot:run
cd purchase-order-service && mvn spring-boot:run
cd sales-dispatch-service && mvn spring-boot:run
cd supplier-customer-service && mvn spring-boot:run
cd analytics-reports-service && mvn spring-boot:run
```

## API Endpoints (via Gateway at :9090)

### Authentication
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authenticated |
| POST | `/api/auth/refresh-token` | Public |

### User Management
| Method | URL | Access |
|--------|-----|--------|
| GET | `/api/users` | ADMIN |
| GET | `/api/users/{id}` | ADMIN |
| PUT | `/api/users/{id}` | ADMIN |
| DELETE | `/api/users/{id}` | ADMIN |

### Inventory
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/products` | ADMIN, WAREHOUSE_STAFF |
| GET | `/api/products?category=&search=&page=0&size=20` | All |
| GET | `/api/products/{id}` | All |
| PUT | `/api/products/{id}` | ADMIN |
| DELETE | `/api/products/{id}` | ADMIN |
| POST | `/api/inventory/update-stock` | All |
| POST | `/api/inventory/barcode-scan?barcode=` | All |
| GET | `/api/warehouses` | All |

### Purchase Orders
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/purchase-orders` | ADMIN, PURCHASE_MANAGER |
| GET | `/api/purchase-orders` | ADMIN, PURCHASE_MANAGER |
| PUT | `/api/purchase-orders/{id}/status?status=SENT` | ADMIN |
| POST | `/api/goods-receipt` | All |

### Sales & Dispatch
| Method | URL | Access |
|--------|-----|--------|
| POST | `/api/sales-orders` | ADMIN, PURCHASE_MANAGER |
| GET | `/api/sales-orders` | All |
| POST | `/api/dispatch` | All |
| POST | `/api/returns` | All |

### Suppliers & Customers
| Method | URL | Access |
|--------|-----|--------|
| POST/GET/PUT/DELETE | `/api/suppliers` | ADMIN, PURCHASE_MANAGER |
| POST/GET/PUT/DELETE | `/api/customers` | ADMIN, PURCHASE_MANAGER |

### Analytics & Reports
| Method | URL | Access |
|--------|-----|--------|
| GET | `/api/analytics/dashboard` | ADMIN |
| GET | `/api/analytics/audit-logs` | ADMIN |
| GET | `/api/reports/stock-valuation` | ADMIN |
| GET | `/api/reports/inventory-turnover` | ADMIN |
| POST | `/api/notifications/email` | ADMIN |

## Swagger UI

After starting, visit:
- Aggregated: `http://localhost:9090/swagger-ui.html`
- Auth: `http://localhost:8081/swagger-ui.html`
- Inventory: `http://localhost:8082/swagger-ui.html`

## Demo Login

```json
POST /api/auth/login
{
  "email": "admin@stockwise.com",
  "password": "admin123"
}
```

Roles: `ADMIN` | `PURCHASE_MANAGER` | `WAREHOUSE_STAFF`

## Run Tests

```bash
cd auth-service
mvn test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | 32+ char secret for JWT signing | (set in .env) |
| `DB_URL` | MySQL JDBC URL | localhost:3306 |
| `DB_USERNAME` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | — |
| `MONGO_URI` | MongoDB connection string | localhost:27017 |
| `INVENTORY_SERVICE_URL` | URL of Inventory Service | http://localhost:8082 |
| `MAIL_HOST` | SMTP host | smtp.gmail.com |
| `MAIL_USERNAME` | SMTP email | — |
| `MAIL_PASSWORD` | SMTP app password | — |

## Tech Stack

- **Java 21** + **Spring Boot 3.2**
- **Spring Security** + **JWT (jjwt 0.12)**
- **Spring Data JPA** → MySQL (Auth)
- **Spring Data MongoDB** → MongoDB (all other services)
- **Spring Cloud Gateway** → API Gateway
- **OpenFeign** → Inter-service REST calls
- **Lombok** → Boilerplate reduction
- **SpringDoc/Swagger** → API documentation
- **Docker + Docker Compose** → Container orchestration
- **JUnit 5 + Mockito** → Unit testing

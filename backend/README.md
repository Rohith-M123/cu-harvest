# CU Harvest Backend API

A comprehensive e-commerce backend built with Node.js, Express, and MySQL for the CU Harvest quick commerce platform.

## 🚀 Features

### Authentication & Authorization
- User registration and login with JWT tokens
- Role-based access control (USER and ADMIN roles)
- Secure password hashing with bcrypt
- Token-based authentication middleware

### User Management
- User profile management
- Address management (multiple addresses per user)
- Order history tracking
- Default address setting

### Product Management
- Full product catalog with categories
- Product search and filtering
- Stock management
- Discount and pricing information
- Product images and descriptions

### Shopping Cart
- Persistent cart storage
- Add/remove/update cart items
- Stock validation
- Cart summary calculations

### Order Processing
- Complete order lifecycle management
- Order placement with validation
- Order status tracking (Placed → Confirmed → Packed → Out for Delivery → Delivered)
- Payment status management
- Order history and details

### Admin Dashboard
- Comprehensive dashboard statistics
- Inventory management
- Stock level monitoring
- Low stock alerts
- Order management
- Admin activity logging
- Category management

### Database Features
- MySQL database with connection pooling
- Comprehensive table relationships
- Transaction support for order processing
- Inventory logging
- Admin action logging
- Proper indexing for performance

## 🏗️ Database Schema

### Core Tables
- **users** - User accounts and profiles
- **user_addresses** - User shipping addresses
- **categories** - Product categories
- **products** - Product catalog
- **orders** - Customer orders
- **order_items** - Individual items in orders
- **cart_items** - Shopping cart contents
- **inventory_logs** - Stock change tracking
- **admin_logs** - Administrative actions

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/profile      # Get user profile
```

### User Management
```
GET  /api/users/addresses           # Get user addresses
POST /api/users/addresses           # Add new address
PUT  /api/users/addresses/:id       # Update address
DELETE /api/users/addresses/:id     # Delete address
GET  /api/users/orders              # Get order history
GET  /api/users/orders/:id          # Get order details
```

### Products
```
GET  /api/products                  # Get all products (with filters)
GET  /api/products/:id              # Get product by ID
GET  /api/products/categories       # Get all categories
POST /api/products                  # [ADMIN] Create product
PUT  /api/products/:id              # [ADMIN] Update product
DELETE /api/products/:id            # [ADMIN] Delete product
GET  /api/products/admin/low-stock  # [ADMIN] Get low stock products
```

### Cart
```
GET  /api/cart              # Get user cart
POST /api/cart              # Add item to cart
PUT  /api/cart/:id          # Update cart item
DELETE /api/cart/:id        # Remove item from cart
DELETE /api/cart            # Clear entire cart
```

### Orders
```
POST /api/orders                    # Create new order
GET  /api/orders/my-orders          # Get user orders
GET  /api/orders/my-orders/:id      # Get order details
GET  /api/orders/admin/all          # [ADMIN] Get all orders
PUT  /api/orders/admin/:id/status   # [ADMIN] Update order status
```

### Admin
```
GET  /api/admin/dashboard           # [ADMIN] Dashboard statistics
GET  /api/admin/inventory           # [ADMIN] Inventory overview
PUT  /api/admin/inventory/product/:id/stock  # [ADMIN] Update product stock
GET  /api/admin/inventory/logs      # [ADMIN] Inventory change logs
GET  /api/admin/logs                # [ADMIN] Admin activity logs
POST /api/admin/categories          # [ADMIN] Create new category
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server
- npm or yarn

### Installation
1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure environment variables in `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=cu_harvest
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret_here
   PORT=5001
   NODE_ENV=development
   ```
5. Set up the database:
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cu_harvest;"
   
   # Run setup script
   node setup.js
   ```
6. Start the server:
   ```bash
   npm run dev  # Development mode with nodemon
   npm start    # Production mode
   ```

### Default Credentials
- **Admin User**: 
  - Email: admin@cu-harvest.com
  - Password: admin123
- **Test User**:
  - Email: john@example.com
  - Password: admin123

## 📊 Testing

Run the test script to verify all endpoints:
```bash
node test-api.js
```

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Joi
- SQL injection prevention
- CORS protection
- Role-based authorization
- Secure HTTP headers

## 📈 Performance Features

- Database connection pooling
- Proper indexing
- Pagination support
- Efficient queries
- Caching considerations

## 🚀 Deployment

### Production Considerations
- Set `NODE_ENV=production`
- Use environment variables for secrets
- Implement proper logging
- Set up monitoring
- Configure SSL/HTTPS
- Database backup strategy
- Load balancing for high traffic

## 📚 Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **mysql2** - MySQL client
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT implementation
- **Joi** - Input validation
- **cors** - CORS handling
- **dotenv** - Environment configuration
- **nodemon** - Development server

## 📝 License

This project is proprietary and confidential.

## 🆘 Support

For issues and questions, please contact the development team.
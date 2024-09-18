const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 8000;

app.use(cors());
app.use(bodyParser.json());

// Configure storage for Multer to handle image uploads
const storage = multer.diskStorage({
  destination: './uploads/', // Folder where images will be stored
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Generate unique filename
  }
});
const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// In-memory storage for orders and products (replace with database in production)
let orders = [];
let products = [];

// Endpoint to receive orders from the customer app
app.post('/orders', (req, res) => {
  const order = req.body;
  if (!order || !order.items) {
    return res.status(400).send('Invalid order');
  }
  order.id = orders.length + 1; // Assign an ID to the order
  order.status = 'Pending'; // Default status for new orders
  orders.push(order);
  res.status(201).send('Order placed');
});

// Endpoint to get all orders for the admin app with filtering and searching capabilities
app.get('/orders', (req, res) => {
  const { id, status } = req.query;

  let filteredOrders = orders;

  if (id) {
    filteredOrders = filteredOrders.filter(order => order.id === parseInt(id));
  }

  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }

  res.json(filteredOrders);
});

// Endpoint to update an order's status
app.put('/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body;

  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).send('Order not found');
  }

  orders[orderIndex].status = status;
  res.json({ message: 'Order status updated', order: orders[orderIndex] });
});

// Endpoint to add products with images
app.post('/products', upload.single('image'), (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !description || !price || !req.file) {
    return res.status(400).send('Missing required product data');
  }

  // Save the product data, including the image path
  const newProduct = {
    id: products.length + 1,
    name,
    description,
    price,
    imageUrl: `/uploads/${req.file.filename}` // Path to the saved image
  };

  products.push(newProduct);
  res.status(201).json({ message: 'Product added successfully!', product: newProduct });
});

// Endpoint to get all products
app.get('/products', (req, res) => {
  res.json(products);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

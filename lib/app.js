const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
const request = require('superagent');
// const { mungeAllBooks } = require('./munge-utils.js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this protected route, we get the user's id like so: ${req.userId}`
  });
});

// search books by title
app.get('/books', async(req, res) => {
  try {
    const books = await request.get(`http://openlibrary.org/search.json?title=${req.query.search}`);

    res.json(books.body.docs);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

// get favorites
app.get('/api/favorites', async(req, res) => {
  try {
    const data = await client.query('SELECT * from favorites WHERE owner_id=$1', [req.userId],
    );
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

// remove book from favorites
app.delete('/api/favorites/:id', async(req, res) => {
  try {
    const data = await client.query('DELETE from favorites WHERE owner_id=$1 AND id=$2', [req.userId, req.params.id],
    );
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

// add new book to favorites
app.post('/api/favorites', async(req, res) => {
  try {
    const {
      title,
      author,
      setting,
      time_period,
      key,
    } = req.body;

    const data = await client.query(`
    INSERT INTO favorites (
      title,
      author,
      setting,
      time_period,
      key,
      owner_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
`,
    [
      title,
      author,
      setting,
      time_period,
      key,
      req.userId
    ]);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;

let express = require('express');
let router = express.Router();

const { getUserInfo, createUser } = require('../controllers');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// Signin
router.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Invalid username or password' });
    return;
  }

  const user = await getUserInfo({ username });
  if (!user) {
    res.status(400).json({ message: 'Invalid username or password' });
    return;
  }

  if (user.password !== password) {
    res.status(400).json({ message: 'Invalid username or password' });
    return;
  }

  res.status(200).json({ username: user.username });
});

// Signup
router.post('/signup', async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    res.status(400).json({ message: 'Missing data' });
    return;
  }

  const user = await getUserInfo({ username });
  if (user) {
    res.status(400).json({ message: 'User already exist' });
    return;
  }

  const isSuccess = await createUser({ username, password, name });

  if (isSuccess) {
    res.status(201).json({ username: user.username });
  } else {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;

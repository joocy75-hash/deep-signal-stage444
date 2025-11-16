const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'AI route working' });
});

module.exports = router;

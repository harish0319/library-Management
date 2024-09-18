const express = require('express');
const router = express.Router();
const {
  issueBook,
  getIssuedBooks,
  returnBook,
  getReturnedBooks,
  payFine, // Add this to the controller imports
} = require('../controllers/bookController');

// Route to issue a book
router.post('/issue', issueBook);

// Route to get all issued books
router.get('/issued', getIssuedBooks);

// Route to return a book (calculate fine)
router.put('/return/:id', returnBook);

// Route to pay fine and complete return
router.put('/pay-fine/:id', payFine); // New route to handle fine payment

// Route to get all returned books
router.get('/returned', getReturnedBooks);

module.exports = router;
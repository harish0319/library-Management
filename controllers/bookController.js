const Book = require('../models/Book');
const { Op } = require('sequelize');

// Issue a new book
exports.issueBook = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Book name is required!' });

  try {
    const newBook = await Book.create({
      name,
      issuedAt: new Date(),
      finePaid: 0, // Initially set fine as unpaid
    });
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Error issuing the book' });
  }
};

// Get all issued books
exports.getIssuedBooks = async (req, res) => {
  try {
    const books = await Book.findAll({ where: { returnedAt: null } }); // Fetch issued books
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching issued books' });
  }
};

// Return a book and calculate fine
exports.returnBook = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const returnTime = new Date();
    const issuedTime = new Date(book.issuedAt);
    const timeDiff = (returnTime - issuedTime) / (1000 * 60); // Time difference in minutes
    let fine = 0;

    if (timeDiff > 2) fine = Math.floor(timeDiff / 2) * 10; // Calculate fine if more than 2 minutes

    if (fine > 0) {
      // Set fine and keep book for fine payment if necessary
      book.fine = fine;
      await book.save();
      res.json(book); // Send book info with fine for frontend handling
    } else {
      // If no fine, complete the return immediately
      book.returnedAt = returnTime;
      book.finePaid = 0; // No fine to pay
      await book.save();
      res.json(book); // Return book with no fine
    }
  } catch (error) {
    res.status(500).json({ error: 'Error returning the book' });
  }
};

// Pay fine and complete return
exports.payFine = async (req, res) => {
  const { id } = req.params;
  const { finePaid } = req.body;

  try {
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (finePaid >= book.fine) {
      // Mark the fine as paid and complete return
      book.finePaid = finePaid;
      book.returnedAt = new Date();
      await book.save();
      res.json(book);
    } else {
      res.status(400).json({ error: 'Insufficient payment for the fine' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error processing fine payment' });
  }
};

// Get all returned books
exports.getReturnedBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      where: { returnedAt: { [Op.not]: null } }, // Fetch returned books
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching returned books' });
  }
};
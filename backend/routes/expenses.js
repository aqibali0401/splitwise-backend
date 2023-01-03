const express = require('express')
const expenseController = require('../controllers/expense');
const router = express.Router();
const authMiddleware = require('../middleware/auth');


// Route 1 : Create Expense: Using POST '/addExpense   (Login required)
router.post('/addExpense', [authMiddleware], expenseController.addExpense);

// Route 2 : Delete Expense: Using Delete '/addExpense   (Login required)
router.delete('/:expenseId', [authMiddleware], expenseController.deleteExpense);

// Route 3 : Update Expense: Using POST '/updateExpense   (Login required)
router.post('/:expenseId', [authMiddleware], expenseController.updateExpense);

// Route 4 : Settle Expense: Using POST '/settleExpense   (Login required)
router.post('/settle/settleExpense', [authMiddleware], expenseController.settleExpense);


module.exports = router;


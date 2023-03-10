const userRoutes = require('../routes/user');
const authRoutes = require('../routes/auth');
const groupRoutes = require('../routes/group');
const expenseRoutes = require('../routes/expenses');
const AppError = require('../common/appError');


module.exports = (app) => {
    app.use('/api/v1/user', userRoutes);
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/group', groupRoutes);
    app.use('/api/v1/expense', expenseRoutes);

    // Error middleware for non-existent routes
    app.all('*', (req, res, next) => next(new AppError(`Can't find ${req.originalUrl} on this server!`, 400)));
};

// Packages required
const { ObjectId } = require('mongodb');

// Secrets from .env


// Try-catch middleware
const asyncMiddleware = require('../middleware/async');

// Models
const Friend = require('../models/friends');
const Expense = require('../models/expenses');


// update balance function
const UpdateBalances = async (paidUser, splitUser, newBal) => {
    const query_filter = {
        $or: [
            {
                $and: [
                    { added_by: paidUser },
                    { friend: splitUser }
                ]
            },
            {
                $and: [
                    { added_by: splitUser },
                    { friend: paidUser }
                ]
            }
        ]
    };

    const friendship = await Friend.findOne(query_filter);

    if (friendship) {
        let updateBal = null;
        const { owe, owed } = friendship.balances;
        if (friendship.added_by.equals(paidUser)) {
            if (owe === 0) {
                updateBal = await Friend.findOneAndUpdate(query_filter, {
                    $inc: {
                        "balances.owed": newBal
                    }
                });
            } else {
                const finalDiff = newBal - owe;
                if (finalDiff >= 0) {
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owe": -owe,
                            "balances.owed": finalDiff
                        }
                    });
                } else {
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owe": -newBal,
                        }
                    });
                }
            }
        } else {
            if (owed === 0) {
                updateBal = await Friend.findOneAndUpdate(query_filter, {
                    $inc: {
                        "balances.owe": newBal
                    }
                });
            } else {
                const finalDiff = newBal - owed;
                if (finalDiff >= 0) {
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owe": finalDiff,
                            "balances.owed": -owed
                        }
                    });
                } else {
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owed": -newBal,
                        }
                    });
                }
            }
        }
    }
};


exports.addExpense = asyncMiddleware(async (req, res) => {

    const userId = req.user;
    const body = { ...req.body };

    // const splitUsers = (body.split_between).slice(0);  // heap memory created
    const splitUsers = (JSON.parse(JSON.stringify(body.split_between)));

    const splitData = (splitUsers).sort((data1, data2) => { return (data2.paid - data2.share) - (data1.paid - data1.share) });

    // if(splitData[0].paid === body.amount) {
    if (splitData[0].paid === body.amount && body.split_method === "equally") {
        const paidUser = new ObjectId(splitData[0].user);
        const paidAmount = splitData[0].paid;
        const userShareAmount = splitData[0].share;
        const balAmount = paidAmount - userShareAmount;
        const restArray = splitData.slice(1, splitData.length);

        const sharePerHead = balAmount / restArray.length;
        for (let i = 0; i < restArray.length; i++) {
            const splitUser = new ObjectId(restArray[i].user);
            await UpdateBalances(paidUser, splitUser, sharePerHead);
        }
    } else {

        for (let i = 0; i < splitData.length - 1; i++) {
            const paidUser = new ObjectId(splitData[i].user);
            const paidAmount = splitData[i].paid;
            const userShareAmount = splitData[i].share;
            let balAmount = paidAmount - userShareAmount;

            if (balAmount === 0) {
                continue;
            }

            for (let j = i + 1; j < splitData.length; j++) {
                const splitUser = new ObjectId(splitData[j].user);
                const splitUserPaidAmount = splitData[j].paid;
                const splitUserShareAmount = splitData[j].share;
                const splitUserBalAmount = splitUserPaidAmount - splitUserShareAmount;

                if (splitUserBalAmount >= 0 || splitUserShareAmount === 0) {
                    continue;
                }

                // const diff = balAmount - splitUserShareAmount;
                const diff = balAmount + splitUserBalAmount;

                if (diff <= 0) {
                    splitData[j].share -= balAmount;

                    await UpdateBalances(paidUser, splitUser, balAmount);
                    balAmount = 0;
                    break;

                } else {
                    splitData[j].share -= splitUserShareAmount;

                    // Call Function here
                    await UpdateBalances(paidUser, splitUser, -splitUserBalAmount);
                    balAmount += splitUserBalAmount;


                }

            }

        }
    }

    body.createdBy = userId;
    const newExpense = new Expense(body);
    const saveNewExpense = await newExpense.save();

    if (!saveNewExpense) {
        return res.status(500).send({ error: "Internal server error!" });
    } else {
        return res.status(201).send({ message: "Expense created successfully!" });
    }

});

exports.deleteExpense = asyncMiddleware(async (req, res) => {

    const { expenseId } = req.params;
    const expense = await Expense.findOne({ _id: expenseId });

    if (!expense) {
        return res.status(404).send({ error: 'Expense not found! Please select a valid expense.' });
    } else {
        for (let i = 0; i < expense.split_between.length; i++) {
            // let {paid, share} = expense.split_between[i];
            [expense.split_between[i].paid, expense.split_between[i].share] = [expense.split_between[i].share, expense.split_between[i].paid];
        }

        const splitData = (expense.split_between).sort((data1, data2) => { return (data2.paid - data2.share) - (data1.paid - data1.share) });

        for (let i = 0; i < splitData.length - 1; i++) {
            const paidUser = new ObjectId(splitData[i].user);
            const paidAmount = splitData[i].paid;
            const userShareAmount = splitData[i].share;
            let balAmount = paidAmount - userShareAmount;

            if (balAmount === 0) {
                continue;
            }

            for (let j = i + 1; j < splitData.length; j++) {
                const splitUser = new ObjectId(splitData[j].user);
                const splitUserPaidAmount = splitData[j].paid;
                const splitUserShareAmount = splitData[j].share;
                const splitUserBalAmount = splitUserPaidAmount - splitUserShareAmount;

                if (splitUserBalAmount >= 0 || splitUserShareAmount === 0) {
                    continue;
                }

                // const diff = balAmount - splitUserShareAmount;
                const diff = balAmount + splitUserBalAmount;

                if (diff <= 0) {
                    splitData[j].share -= balAmount;

                    await UpdateBalances(paidUser, splitUser, balAmount);
                    balAmount = 0;
                    break;

                } else {
                    splitData[j].share -= splitUserShareAmount;

                    // Call Function here
                    await UpdateBalances(paidUser, splitUser, -splitUserBalAmount);
                    balAmount += splitUserBalAmount;


                }

            }

        }

        const isExpenseDeleted = await Expense.findByIdAndDelete({ _id: expenseId });

        if (isExpenseDeleted) {
            return res.status(200).send("Expense Deleted Succesfully!");
        }

    }

});


exports.updateExpense = asyncMiddleware(async (req, res) => {
    const userId = req.user;
    const { expenseId } = req.params;

    const expense = await Expense.findOne({ _id: expenseId });

    if (!expense) {
        return res.status(404).send({ error: 'Expense not found! Please select a valid expense.' });
    } else {

        // first delete this expense then add new expense
        for (let i = 0; i < expense.split_between.length; i++) {
            // let {paid, share} = expense.split_between[i];
            [expense.split_between[i].paid, expense.split_between[i].share] = [expense.split_between[i].share, expense.split_between[i].paid];
        }

        const splitData = (expense.split_between).sort((data1, data2) => { return (data2.paid - data2.share) - (data1.paid - data1.share) });

        for (let i = 0; i < splitData.length - 1; i++) {
            const paidUser = new ObjectId(splitData[i].user);
            const paidAmount = splitData[i].paid;
            const userShareAmount = splitData[i].share;
            let balAmount = paidAmount - userShareAmount;

            if (balAmount === 0) {
                continue;
            }

            for (let j = i + 1; j < splitData.length; j++) {
                const splitUser = new ObjectId(splitData[j].user);
                const splitUserPaidAmount = splitData[j].paid;
                const splitUserShareAmount = splitData[j].share;
                const splitUserBalAmount = splitUserPaidAmount - splitUserShareAmount;

                if (splitUserBalAmount >= 0 || splitUserShareAmount === 0) {
                    continue;
                }

                // const diff = balAmount - splitUserShareAmount;
                const diff = balAmount + splitUserBalAmount;

                if (diff <= 0) {
                    splitData[j].share -= balAmount;

                    await UpdateBalances(paidUser, splitUser, balAmount);
                    balAmount = 0;
                    break;

                } else {
                    splitData[j].share -= splitUserShareAmount;

                    // Call Function here
                    await UpdateBalances(paidUser, splitUser, -splitUserBalAmount);
                    balAmount += splitUserBalAmount;

                }

            }

        }

        const isExpenseDeleted = await Expense.findByIdAndDelete({ _id: expenseId });

        // if(isExpenseDeleted) {
        //     return res.status(200).send("Expense Deleted Succesfully!");
        // }

        /// now add new expense

        const body = { ...req.body };

        // const splitUsers = (body.split_between).slice(0);
        const splitUsers = (JSON.parse(JSON.stringify(body.split_between)));

        const splitData2 = (splitUsers).sort((data1, data2) => { return (data2.paid - data2.share) - (data1.paid - data1.share) });

        if (splitData2[0].paid === body.amount && body.split_method === "equally") {
            const paidUser = new ObjectId(splitData2[0].user);
            const paidAmount = splitData2[0].paid;
            const userShareAmount = splitData2[0].share;
            const balAmount = paidAmount - userShareAmount;
            const restArray = splitData2.slice(1, splitData2.length);
            const sharePerHead = balAmount / restArray.length;
            for (let i = 0; i < restArray.length; i++) {
                const splitUser = new ObjectId(restArray[i].user);

                await UpdateBalances(paidUser, splitUser, sharePerHead);
            }
        } else {
            for (let i = 0; i < splitData2.length - 1; i++) {
                const paidUser = new ObjectId(splitData2[i].user);
                const paidAmount = splitData2[i].paid;
                const userShareAmount = splitData2[i].share;
                let balAmount = paidAmount - userShareAmount;

                if (balAmount === 0) {
                    continue;
                }

                for (let j = i + 1; j < splitData2.length; j++) {
                    const splitUser = new ObjectId(splitData2[j].user);
                    const splitUserPaidAmount = splitData2[j].paid;
                    const splitUserShareAmount = splitData2[j].share;
                    const splitUserBalAmount = splitUserPaidAmount - splitUserShareAmount;

                    if (splitUserBalAmount >= 0 || splitUserShareAmount === 0) {
                        continue;
                    }
                    // const diff = balAmount - splitUserShareAmount;
                    const diff = balAmount + splitUserBalAmount;

                    if (diff <= 0) {
                        splitData2[j].share -= balAmount;
                        await UpdateBalances(paidUser, splitUser, balAmount);
                        balAmount = 0;
                        break;

                    } else {
                        splitData2[j].share -= splitUserShareAmount;
                        // Call Function here
                        await UpdateBalances(paidUser, splitUser, -splitUserBalAmount);
                        balAmount += splitUserBalAmount;
                    }

                }

            }
        }

        body.createdBy = userId;
        const newExpense = new Expense(body);
        const saveNewExpense = await newExpense.save();

        if (!saveNewExpense) {
            return res.status(500).send({ error: "Internal server error!" });
        } else {
            return res.status(201).send({ message: "Expense Updated successfully!" });
        }

    }

});

exports.settleExpense = (async (req, res) => {

    try {

        const body = { ...req.body };

        // const paidUser = new ObjectId(body.paidBy);
        // const paidTo = new ObjectId(body.paidTo);
        const paidUser = (body.paidBy);
        const paidTo = (body.paidTo);
        const paidAmount = body.amount;

         await UpdateBalances(paidUser, paidTo, paidAmount);

        return res.status(200).send({ message: "Expense settled successfully!" });


    } catch (error) {
        return res.status(500).send({ error: "Internal server error!" });
    }


});


const User = require('../models/users');
const Friend = require('../models/friends');
const Expenses = require('../models/expenses');
const SettleExpenses = require('../models/settleExpenses');
const { body, validationResult } = require('express-validator');


exports.getUsers = async (req, res, next) => {

    res.send("hello from user controler");

}

exports.addFriends = async (req, res) => {
    try {
        const userId = req.user;
        const body = { ...req.body };
        // const userEmail = await User.findOne({ _id: userId }).select("email");
        let success = false;
        const friends = [];
        const notFoundUsers = [];
        for (let i = 0; i < body.friends.length; i++) {
            const friendId = await User.findOne({ email: body.friends[i] }).select("_id");
            if (!friendId) {
                notFoundUsers.push(friendId);
            }
            if (friendId._id.equals(userId)) {
                continue;
            }
            friends.push(friendId._id);
        }

        if (friends.length < 1) {
            return res.status(400).send({
                success,
                error: "Non of your friend registerd with us, to add them in your friend list sent invite link to thme!!",
                result: notFoundUsers
            })
        }

        // const friendsData = await User.findOne({ _id: userId }).select('friends');
        // const friendListPrevious = friendsData.friends;

        // const totalFriends = friendListPrevious.concat(friendList);
        // // const finalFriendList = [...new Set(totalFriends)];

        // let finalFriendList = [];
        // for (let i = 0; i < totalFriends.length; i++) {
        //     // if(finalFriendList.indexOf(totalFriends[i]) === -1){
        //     //     finalFriendList.push(totalFriends[i]);
        //     // }
        //     let flag = false;
        //     for (let j = 0; j < finalFriendList.length; j++) {
        //         if (finalFriendList[j].equals(totalFriends[i])) {
        //             flag = true;
        //             break;
        //         }
        //     }
        //     if (flag == false) {
        //         finalFriendList.push(totalFriends[i]);
        //     }
        // }

        // const finalFriends = await User.findOneAndUpdate({ _id: userId }, {
        //     $set: { friends: finalFriendList }
        // })
        // success = true;
        // res.status(200).send({
        //     success,
        //     message: 'Friends added successfully',
        //     result: finalFriends
        // })

        // ashwani friends code
        let flag = false;
        for (let i = 0; i < friends.length; i++) {
            // Query filter to search for existing mapping between both users
            const query_filter = {
                $or: [
                    {
                        $and: [
                            { added_by: userId },
                            { friend: friends[i] }
                        ]
                    },
                    {
                        $and: [
                            { added_by: friends[i] },
                            { friend: userId }
                        ]
                    }
                ]
            };

            const ExistingFriends = await Friend.findOne(query_filter);
            if (ExistingFriends) {
                continue;
            } else {
                const newFriend = {
                    added_by: userId,
                    friend: friends[i]
                };

                const createnewFriend = new Friend(newFriend);
                const addNewFriend = await createnewFriend.save();
                if (!addNewFriend) {
                    flag = true;
                    break;
                }
            }
        }

        if (flag) {
            return res.status(500).send({ error: 'Internal server error!' });
        } else {
            return res.status(200).send({ message: "All of your friends are added!" });
        }

    } catch (error) {
        res.status(400).send({
            error: "Could not able to add friend"
        })
    }

}

exports.fetchFriends = async (req, res) => {
    try {
        const userId = req.user;
        const query_filter = {
            $or: [
                { added_by: userId },
                { friend: userId }
            ]
        };
        const friendList = await Friend.find(query_filter).populate('added_by friend', 'userName email');

        if (!friendList) {
            return res.status(400).send({
                error: "You dont have any friends till now!! "
            })
        }

        let myFriends = [];
        for (let i = 0; i < friendList.length; i++) {
            if ((friendList[i].added_by._id).equals(userId)) {
                myFriends.push({
                    friend: friendList[i].friend,
                    balances: friendList[i].balances
                });
            } else if ((friendList[i].friend._id).equals(userId)) {
                myFriends.push({
                    friend: friendList[i].added_by,
                    balances: friendList[i].balances
                });
            }
        }

        if (myFriends.length < 1) {
            return res.status(404).send({ error: "No friends found associated with you!" });
        } else {
            return res.status(200).json({
                message: "Friends fetched successfully",
                result: myFriends
            });
        }


    } catch (error) {
        res.status(400).send({
            error: "Could not able to fetch friends"
        })
    }

}


exports.fetchUserDetails = async (req, res) => {
    try {
        const userId = req.user;
        const friendList = await User.findById({ _id: userId });
        return res.status(200).send({
            message: 'User details fetched successfully',
            result: friendList
        })
    } catch (error) {
        return res.status(400).send({
            error: "Could not able to fetch user details"
        })
    }
};


exports.totalOwenOwedAmount = async (req, res) => {
    try {
        let isFriendPresent = false;
        const userId = req.user;
        const query_filter = {
            $or: [
                { added_by: userId },
                { friend: userId }
            ]
        };
        const friendList = await Friend.find(query_filter).populate('added_by friend', 'userName email');

        if (!friendList) {
            isFriendPresent = true;
            return res.status(400).send({
                error: "You dont have any friends till now!! "
            })
        }

        // console.log('login user ki id -> ', userId);

        // let totalOweAmount = 0;
        // let totalOwedAmount = 0;

        // for check friendList
        // console.log('friendList', friendList[0].added_by.userName);


        let totalLenahe = 0;
        let totalDenahe = 0;

        for (let i = 0; i < friendList.length; i++) {
            if ((friendList[i].added_by._id).equals(userId)) {
                totalLenahe += friendList[i].balances.owed;
                totalDenahe += friendList[i].balances.owe;
            } else if ((friendList[i].friend._id).equals(userId)) {
                totalLenahe += friendList[i].balances.owe;
                totalDenahe += friendList[i].balances.owed;
            }
        }

        // if (isFriendPresent) {
        return res.status(200).json({
            message: 'Successfully Get Owen owed Amount',
            result: { totalLenahe, totalDenahe }
        })
        // } else {
        //     return res.status(404).send({ error: "No friends found associated with you! so their is no own owed amount for you..." })
        // } 


    } catch (error) {
        res.status(400).send({
            error: "Could not able to fetch friends"
        })
    }

};


exports.fetchOwenOwedAmountFromDiffrentUser = async (req, res) => {
    try {
        const userId = req.user;
        const query_filter = {
            $or: [
                { added_by: userId },
                { friend: userId }
            ]
        };
        const friendList = await Friend.find(query_filter).populate('added_by friend', 'userName email');

        if (!friendList) {
            isFriendPresent = true;
            return res.status(400).send({
                error: "You dont have any friends till now!! "
            })
        }

        // for check friendList
        // console.log('friendList ->', friendList[0].added_by.userName);
        // console.log('friendList ->', friendList);

        let lenaHePeople = [];
        let denaHePeople = [];

        for (let i = 0; i < friendList.length; i++) {
            if ((friendList[i].added_by._id).equals(userId)) {
                let personOwed = { userName: '', amount: 0 };
                let personOwe = { userName: '', amount: 0 };

                if (friendList[i].balances.owed > 0) {
                    personOwed.userName = friendList[i].friend.userName;
                    personOwed.amount = friendList[i].balances.owed;
                    lenaHePeople.push(personOwed);
                }
                if (friendList[i].balances.owe > 0) {
                    personOwe.userName = friendList[i].friend.userName;
                    personOwe.amount = friendList[i].balances.owe;
                    denaHePeople.push(personOwe);
                }
            } else if ((friendList[i].friend._id).equals(userId)) {
                let personOwed = { userName: '', amount: 0 };
                let personOwe = { userName: '', amount: 0 };

                if (friendList[i].balances.owed > 0) {
                    personOwed.userName = friendList[i].added_by.userName;
                    personOwed.amount = friendList[i].balances.owed;
                    denaHePeople.push(personOwed);
                }
                if (friendList[i].balances.owe > 0) {
                    personOwe.userName = friendList[i].added_by.userName;
                    personOwe.amount = friendList[i].balances.owe;
                    lenaHePeople.push(personOwe);
                }
            }
        }

        // console.log('denaHePeople -> ', denaHePeople);
        // console.log('lenaHePeople -> ', lenaHePeople);

        return res.status(200).json({
            message: 'Successfully Get Owen person array!!',
            result: { lenaHePeople, denaHePeople }
        })


        // const logdinUserDetail = await User.findById({ _id: userId });

        // console.log('logdinUserDetail', logdinUserDetail.userName);

    } catch (error) {
        res.status(400).send({
            error: "Internal server error occured!!"
        })
    }
};

exports.fetchUserExpenses = async (req, res) => {
    try {
        const userId = req.user;
        const { friendId } = req.params;
        // console.log(userId);
        // console.log(body.userId);

        const query_filter = {
            $and: [
                {
                    'split_between.user': userId,
                },
                {
                    'split_between.user': friendId
                }
            ]
        }

        const expensesArr = await Expenses.find(query_filter)

        console.log(expensesArr);

        res.send(expensesArr);



    } catch (error) {
        res.status(400).send({
            error: "Internal server error occured!!"
        })
    }
};

exports.fetchUserSettleExpenses = async (req, res) => {
    try {
        const userId = req.user;
        const { friendId } = req.params;

        const query_filter = {
            $or: [
                {
                    $and: [
                        { paidBy: userId },
                        { paidTo: friendId }
                    ]
                },
                {
                    $and: [
                        { paidBy: friendId },
                        { paidTo: userId }
                    ]
                }
            ]
        }


        const settledExpenses =  await SettleExpenses.find(query_filter);

        res.send(settledExpenses);


    } catch (error) {
        res.status(400).send({
            error: "Internal server error occured!!"
        })
    }
}





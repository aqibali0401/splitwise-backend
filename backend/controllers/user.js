const User = require('../models/users');
const Friend = require('../models/friends');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');


exports.getUsers = async (req, res, next) => {

    res.send("hello from user controler");

}

exports.addFriends = async (req, res) => {
    try {
        const userId = req.user;
        const body = { ...req.body };
        // const userEmail = await User.findOne({ _id: userId }).select("email");
        let success = false;
        // console.log(body);
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
        for(let i = 0 ; i < friends.length; i++) {
            // Query filter to search for existing mapping between both users
            const query_filter = {
                $or: [
                    {$and: [
                        {added_by: userId},
                        {friend: friends[i]}
                    ]},
                    {$and: [
                        {added_by: friends[i]},
                        {friend: userId}
                    ]}
                ]
            };

            const ExistingFriends = await Friend.findOne(query_filter);
            if(ExistingFriends) {
                continue;
            } else {
                const newFriend = {
                    added_by: userId,
                    friend: friends[i]
                };

                const createnewFriend = new Friend(newFriend);
                const addNewFriend = await createnewFriend.save();
                if(!addNewFriend) {
                    flag = true;
                    break;
                }
            }
        }

        if(flag) {
            return res.status(500).send({error: 'Internal server error!'});
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
        const friendList = await User.findById({ _id: userId }).select('friends');

        if (!friendList.friends) {
            return res.status(400).send({
                error: "You dont have any friends till now!! "
            })
        }

        const friendsDetails = [];
        for (let i = 0; i < friendList.friends.length; i++) {
            let friendData = await User.findById({ _id: friendList.friends[i] });
            friendsDetails.push(friendData);
        }

        res.status(200).send({
            message: 'Friends fetched successfully',
            result: friendsDetails
        })


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
        console.log(friendList);
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


exports.inviteFriend = async (req, res) => {
    [
        body('email', 'Enter a valid email').isEmail().normalizeEmail().trim()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() })
        }
        try {
            
        } catch (error) {
            
        }




    }




}


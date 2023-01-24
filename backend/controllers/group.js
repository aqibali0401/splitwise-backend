const User = require('../models/users');
const Group = require('../models/groups');
const Friend = require('../models/friends');
const asyncMiddleware = require('../middleware/async');
const { body, validationResult } = require('express-validator');
const { checkValueInArray } = require('../init/functions');
const fun = require('../init/functions')

// Route 1: Creating a user using POST "/api/v1/auth/register"   ->  No login required
module.exports.createGroup = ([
    body('groupName', 'Enter a valid group name').isLength({ min: 3 }).trim(),
    body('groupType', 'Select a valid group type').matches(/^[a-zA-Z][\w\s-]+/).isEmpty().isLength({ min: 3 })
], async (req, res) => {
    // If their are errors, return bad request and the errors

    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }
    try {
        let success = false;

        body.admin = req.user; //Assigning the id of group admin
        // body.groupName = fun.Capitalize(body.groupName); // To capitalize each word of group name
        body.groupName = body.groupName;
        const query_filter = {
            $and: [
                { groupName: body.groupName },
                {
                    $or: [
                        { admin: body.admin },
                        { "members": body.admin }
                    ]

                }
            ]
        };

        // check wheather the group with this groupName exists already 
        let group = await Group.findOne(query_filter);
        if (group) {
            return res.status(400).json({ success, error: "sorry a group with this group Name is already exists! give another Name to your group" });
        }
        const { groupName, groupType, members: membersList } = req.body;

        const members = [];
        const notFoundMembers = [];

        for (let i = 0; i < membersList.length; i++) {
            const currEmail = membersList[i];
            const foundMail = await User.findOne({ email: currEmail });
            if (foundMail) {
                checkValueInArray(foundMail._id, members);
            } else {
                checkValueInArray(currEmail, notFoundMembers)
            }
        }


        if (notFoundMembers.length > 0) {
            if (notFoundMembers.length === 1) {
                return res.status(400).json({ success, error: `${notFoundMembers} -> This members is not registered with us, send invite link to them then try to create group!!` });
            } else {
                return res.status(400).json({ success, error: `${notFoundMembers} -> These members are not registered with us, send invite link to them then try to create group!!` });
            }
        }
        else {
            success = true;
            req.body.members = members;
            console.log(req.body);
            const newGroup = new Group(req.body);
            const newGroupSaved = await newGroup.save();
            if (!newGroupSaved) {
                return res.status(401).send({ error: "Unable to create group due to some technical error! Please try again!" });
            } else {
                let flag = false;
                for (let i = 0; i < members.length; i++) {
                    // Query filter to search for existing mapping between both users
                    const query_filter1 = {
                        $or: [
                            {
                                $and: [
                                    { added_by: body.admin },
                                    { friend: members[i] }
                                ]
                            },
                            {
                                $and: [
                                    { added_by: members[i] },
                                    { friend: body.admin }
                                ]
                            }
                        ]
                    };

                    const ExistingFriends = await Friend.findOne(query_filter1);
                    if (ExistingFriends) {
                        continue;
                    } else {
                        const newFriend = {
                            added_by: body.admin,
                            friend: members[i]
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
                    return res.status(200).send({ message: 'Group created successfully' });
                }
            }

        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: 'Internal server error!' });
    }
});



exports.fetchGroup = (async (req, res) => {
    try {
        const userId = req.user; // Passed after verifying token
        // Query filter to search only groups associated with user
        const query_filter = {
            $or: [
                { "admin": userId },
                { "members": userId }
            ]
        };
        // Running the query to find groups associated with user
        const groups = await Group.find(query_filter).populate("admin members", "_id userName email");

        // Response after query
        if (groups.length < 1) {
            return res.status(404).send({ error: "No groups found associated with you!" });
        } else {
            return res.status(200).json({
                message: "Group List fetched successfully!",
                result: groups
            });
        }
    } catch (error) {
        console.error(error.message);
        res.send(500).send({ error: "Internal server error!!" });
    }

});
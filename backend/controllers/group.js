const User = require('../models/users');
const Group = require('../models/groups');
const asyncMiddleware = require('../middleware/async');
const { body, validationResult } = require('express-validator');
const { checkValueInArray } = require('./init/functions');

// Route 1: Creating a user using POST "/api/v1/auth/register"   ->  No login required
module.exports.createGroup = ([
    body('groupName', 'Enter a valid group name').isLength({ min: 3 }).trim(),
    body('groupType', 'Select a valid group type').matches(/^[a-zA-Z][\w\s-]+/).isEmpty().isLength({ min: 3 }),
    

], async (req, res) => {
    // If their are errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        let success = false;
        // check wheather the group with this groupName exists already
        let group = await Group.findOne({ groupName: req.body.groupName });
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

        // console.log("members", members);
        // console.log("notFoundMembers", notFoundMembers);

        // create a group using above details
        const admin = req.user;

        if (notFoundMembers.length > 0) {
            if (notFoundMembers.length === 1) {
                return res.status(400).json({ success, error: `${notFoundMembers} -> This members is not registered with us, send invite link to them then try to create group!!` });
            } else {
                return res.status(400).json({ success, error: `${notFoundMembers} -> These members are not registered with us, send invite link to them then try to create group!!` });
            }

        }
        else {
            // console.log(members);
            success = true;
            /// dikkat dera he

            group = await Group.create({ groupName, admin, groupType, members });
            group.save();
            console.log("group", group);
            return res.status(200).send({
                success,
                message: "group created successfully",
                result: group
            })
        }
    } catch (error) {
        console.error(error.message);
        res.send(500).send("Internal server error!!");
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
        res.send(500).send("Internal server error!!");
    }

});
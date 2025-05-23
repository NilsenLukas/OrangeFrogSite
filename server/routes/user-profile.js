// user-profile routes
require('dotenv').config();
const express = require("express");
const router = express.Router();
const { userCollection } = require('../mongo');

// Gets user's info
router.get('/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const user = await userCollection.findOne(
            { email },
            {
                name: 1,
                email: 1,
                address: 1,
                phone: 1,
                dob: 1,
                shirtSize: 1,
                firstAidCert: 1,
                allergies: 1,
                hourlyRate: 1,
                _id: 1,
            }
        );
        
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Updates user info
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    try {
        const result = await userCollection.updateOne(
            { _id: id },
            { $set: updatedData }
        );
        if (result.modifiedCount > 0) {
            const updatedUser = await userCollection.findOne({ _id: id });
            res.status(200).json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
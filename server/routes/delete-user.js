/*NEW STUFF*/
require('dotenv').config();
const express = require("express");
const router = express.Router();
const { userCollection } = require('../mongo');

// Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const user = await userCollection.findById(req.params.id);
        const result = await userCollection.findByIdAndDelete(req.params.id);
        if (result) {
            const newNotification = new notificationCollection({
                userID: user?._id,
                subject: "User",
                text0: `User ${user.name} has been deleted`,
                forAdmin: true
            });
    
            await newNotification.save();

            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router;

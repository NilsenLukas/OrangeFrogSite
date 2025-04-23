/*NEW STUFF*/
require('dotenv').config();
const express = require("express");
const router = express.Router();
const { userCollection, eventCollection, userJobCommentCollection, TimeTracking, correctionReportCollection, invoiceCollection, notificationCollection } = require('../mongo');

// Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const user = await userCollection.findById(req.params.id);
        const result = await userCollection.findByIdAndDelete(req.params.id);
        if (result) {
            // Delete associated job comments
            await userJobCommentCollection.deleteMany({ userID: req.params.id });

            // Delete time tracking entries
            await TimeTracking.deleteMany({ userId: req.params.id });

            // Delete correction reports
            await correctionReportCollection.deleteMany({ userID: req.params.id });

            // Delete invoices
            await invoiceCollection.deleteMany({ user: req.params.id });

            // Optional: Remove user from event references (safer than deletion)
            await eventCollection.updateMany(
                {},
                {
                    $pull: {
                        assignedContractors: req.params.id,
                        acceptedContractors: req.params.id,
                        rejectedContractors: req.params.id,
                        approvedContractors: req.params.id,
                    }
                }
            );
            
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

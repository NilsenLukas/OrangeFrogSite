/*NEW STUFF*/
require('dotenv').config();
const express = require("express");
const router = express.Router();
const { userCollection, eventCollection, userJobCommentCollection, TimeTracking, correctionReportCollection, invoiceCollection, notificationCollection } = require('../mongo');

// Delete user by ID
// Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const user = await userCollection.findById(req.params.id);
        const result = await userCollection.findByIdAndDelete(req.params.id);
        if (result) {
            // Fetch associated job comments before deletion
            const jobComments = await userJobCommentCollection.find({ userID: req.params.id });
            for (const comment of jobComments) {
                await eventCollection.updateOne(
                    { _id: comment.eventID },
                    { $inc: { jobCommentCount: -1 } }
                );
            }

            // Delete job comments
            await userJobCommentCollection.deleteMany({ userID: req.params.id });

            // Fetch associated correction reports before deletion
            const corrections = await correctionReportCollection.find({ userID: req.params.id });
            for (const correction of corrections) {
                await eventCollection.updateOne(
                    { _id: correction.eventID },
                    { $inc: { correctionCount: -1 } }
                );
            }

            // Delete correction reports
            await correctionReportCollection.deleteMany({ userID: req.params.id });

            // Delete time tracking entries
            await TimeTracking.deleteMany({ userId: req.params.id });

            // Delete invoices
            await invoiceCollection.deleteMany({ user: req.params.id });

            // Remove user from event references
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

            // Log the deletion with a notification
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
        console.error(error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});


module.exports = router;

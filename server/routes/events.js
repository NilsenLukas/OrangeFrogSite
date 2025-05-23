// Events route
require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const router = express.Router();
const { eventCollection, userCollection, userJobCommentCollection, notificationCollection, correctionReportCollection } = require('../mongo');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Route to get all events
router.get('/', async (req, res) => {
    try {
        const events = await eventCollection
            .find({})
            .populate('acceptedContractors', 'name')
            .populate('assignedContractors', 'name')
            .select('-__v')  // Exclude version field
            .lean();  // Convert to plain JavaScript objects
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Route to get a single event
router.get('/:id', async (req, res) => {
    try {
        const event = await eventCollection.findById(req.params.id)
            .populate('assignedContractors', 'name email')
            .populate('acceptedContractors', 'name email')
            .populate('approvedContractors', 'name email')
            .populate('rejectedContractors', 'name email');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event details' });
    }
});

// Route to delete an event by ID
router.delete('/:id', async (req, res) => {
    try {
        event = await eventCollection.findById(req.params.id);
        await eventCollection.findByIdAndDelete(req.params.id);

        const newNotification = new notificationCollection({
            subject: "Event",
            text0: `Event ${event?.eventName} has been deleted`,
            forAdmin: true
        });
        await newNotification.save();

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Error deleting event' });
    }
});

// Route to update an event by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get the current event before update
        const currentEvent = await eventCollection.findById(id);
        if (!currentEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const updatedData = {
            ...req.body,
            updatedAt: new Date()
        };

        // Compare old and new assignedContractors
        if (req.body.assignedContractors) {
            const oldContractors = currentEvent.assignedContractors.map(String);
            const newContractors = req.body.assignedContractors.map(String);

            const newlyAssigned = newContractors.filter(id => !oldContractors.includes(id));

            for (const contractorId of newlyAssigned) {
                const newNotification = new notificationCollection({
                    userID: contractorId,
                    subject: "Job",
                    text0: `New job `,
                    linkPath1: `/user/events/${currentEvent?._id}`,
                    linkText1: `${currentEvent?.eventName}`,
                });
    
                await newNotification.save();
            }
        }

        const updatedEvent = await eventCollection.findByIdAndUpdate(
            id,
            updatedData,
            {
                new: true,
                overwrite: false,
                returnDocument: 'after'
            }
        );

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
});

// Route to send notifications to newly added contractors
router.post('/send-notifications', async (req, res) => {
    const { eventId, contractorIds } = req.body;

    try {
        // Fetch the event details
        const event = await eventCollection.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Fetch the contractors' details
        const contractors = await userCollection.find({ _id: { $in: contractorIds } });

        // Send email to each new contractor
        for (const contractor of contractors) {
            const acceptJobUrl = `http://yourfrontendurl.com/accept-job?eventId=${event._id}&contractorId=${contractor._id}`;
            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: contractor.email,
                subject: `New Job Opportunity: ${event.eventName}`,
                html: `
                    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
                        <div style="text-align: center; padding: 20px 0;">
                            <img src="https://orangefrog.swbdatabases3.com/wp-content/uploads/2024/03/orange-frog-logo.png" alt="Company Logo" style="width: 150px; height: auto;">
                        </div>
                        
                        <div style="background-color: #F16636; padding: 30px; border-radius: 8px;">
                            <h2 style="color: #ffffff;">Hello, ${contractor.name}</h2>
                            <p style="font-size: 16px; color: #ffffff;">
                                We have a new job opportunity for you! Here are the details:
                            </p>
                            
                            <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="font-size: 16px; margin: 0;"><strong>Event Name:</strong> ${event.eventName}</p>
                                <p style="font-size: 16px; margin: 0;"><strong>Location:</strong> ${event.eventLocation}</p>
                                <p style="font-size: 16px; margin: 0;"><strong>Load In:</strong> ${new Date(event.eventLoadIn).toLocaleString()}</p>
                                <p style="font-size: 16px; margin: 0;"><strong>Load Out:</strong> ${new Date(event.eventLoadOut).toLocaleString()}</p>
                                <p style="font-size: 16px; margin: 0;"><strong>Total Hours:</strong> ${event.eventHours}</p>
                                <p style="font-size: 16px; margin: 0;"><strong>Description:</strong> ${event.eventDescription}</p>
                            </div>

                            <p style="font-size: 16px; color: #ffffff;">
                                If you're interested in this job, please click the button below to accept the opportunity.
                            </p>

                            <div style="text-align: center; margin-top: 20px;">
                                <a href="${acceptJobUrl}" style="background-color: #ffffff; color: black; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 16px;">
                                    Accept Job
                                </a>
                            </div>
                        </div>
                        
                        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
                            If you have any questions, feel free to <a href="mailto:support@yourcompany.com" style="color: #F16636; text-decoration: none;">contact our support team</a>.
                        </p>
                        
                        <div style="text-align: center; padding: 10px 0; font-size: 12px; color: #aaa;">
                            © ${new Date().getFullYear()} Orange Frog, Inc. All rights reserved.
                        </div>
                    </div>`
            };

            const newNotification = new notificationCollection({
                userID: contractor?._id,
                subject: "Job",
                text0: `New job `,
                linkPath1: `/user/events/${newEvent?._id}`,
                linkText1: `${newEvent?.eventName}`,
            });

            await newNotification.save();

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Email sent to ${contractor.email}`);
            } catch (error) {
                console.error(`Error sending email to ${contractor.email}:`, error);
            }
        }

        res.status(200).json({ message: 'Notifications sent successfully' });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ message: 'Error sending notifications' });
    }
});

// Get user's jobs for the find jobs page
router.get('/assigned/:email', async (req, res) => {
    try {
        const contractor = await userCollection.findOne({ email: req.params.email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        // Find events where the contractor is assigned but hasn't taken any action
        const events = await eventCollection.find({
            assignedContractors: contractor._id,
            // Exclude events where the contractor has already taken action
            acceptedContractors: { $ne: contractor._id },
            approvedContractors: { $ne: contractor._id }
        });

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching assigned jobs:', error);
        res.status(500).json({ message: 'Error fetching assigned jobs' });
    }
});


// Route to accept an event
router.post('/accept', async (req, res) => {
    const { eventId, userId } = req.body;

    try {
        const user = await userCollection.findById(userId);
        const event = await eventCollection.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Update acceptedContractors
        if (!event.acceptedContractors.includes(userId)) {
            event.acceptedContractors.push(userId);
        }

        const newNotification = new notificationCollection({
            subject: "Event",
            text0: `User ${contractor.name} has accepted the event `,
            linkPath1: `/admin/corrections/${event?._id}`,
            linkText1: `${event?.eventName}`,
            forAdmin: true
        });
        await newNotification.save();

        await event.save();
        res.status(200).json({ message: 'Job accepted successfully' });
    } catch (error) {
        console.error('Error accepting job:', error);
        res.status(500).json({ message: 'Error accepting job' });
    }
});


// Route to reject an event
router.post('/reject', async (req, res) => {
    const { eventId, userEmail } = req.body;

    try {
        const event = await eventCollection.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const user = await userCollection.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id;
    

        // Add to rejectedContractors if not already there
        if (!event.rejectedContractors.includes(userId)) {
            event.rejectedContractors.push(userId);
        }
        const comment = await jobComment.findOne({ eventID: event._id, userID: user._id });
        if (comment) {
            event.jobCommentCount -= 1;
            await jobComment.findOneAndDelete({ eventID: event._id, userID: user._id });
        }
        const deletedResult = await correctionReportCollection.deleteMany({ eventID: event._id, userID: user._id });

        if (deletedResult.deletedCount > 0) {
            event.correctionCount -= deletedResult.deletedCount;
            await event.save();
        }


        const newNotification = new notificationCollection({
            subject: "Event",
            text0: `User ${contractor.name} has reject the event `,
            linkPath1: `/admin/corrections/${event?._id}`,
            linkText1: `${event?.eventName}`,
            forAdmin: true
        });
        await newNotification.save();

        await event.save();
        res.status(200).json({ message: 'Job rejected successfully' });
    } catch (error) {
        console.error('Error rejecting job:', error);
        res.status(500).json({ message: 'Error rejecting job' });
    }
});

// Route to reject an event application after applying for an event
router.post('/reject-application', async (req, res) => {
    const { eventId, userEmail } = req.body;

    try {
        const event = await eventCollection.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const user = await userCollection.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id;
        console.log(userId)

        // Add to rejectedContractors if not already there
        if (!event.rejectedContractors.includes(userId)) {
            event.rejectedContractors.push(userId);
        }

        if (!event.acceptedContractors.includes(userId)) {
            event.acceptedContractors.push(userId);
        }

        event.acceptedContractors.pull(userId);
        event.approvedContractors.pull(userId);
        
        // Delete user's comment or corrections for that event
        const comment = await userJobCommentCollection.findOne({ eventID: event._id, userID: user._id });
        if (comment) {
            event.jobCommentCount -= 1;
            await jobComment.findOneAndDelete({ eventID: event._id, userID: user._id });
        }
        const deletedResult = await correctionReportCollection.deleteMany({ eventID: event._id, userID: user._id });

        if (deletedResult.deletedCount > 0) {
            event.correctionCount -= deletedResult.deletedCount;
            await event.save();
        }

        await event.save();
        res.status(200).json({ message: 'Job rejected successfully' });
    } catch (error) {
        console.error('Error rejecting job:', error);
        res.status(500).json({ message: 'Error rejecting job' });
    }
});

// Route to fetch user jobs
router.get('/user-jobs/:userId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId); // Use 'new' to create ObjectId

        const acceptedJobs = await eventCollection.find({ acceptedContractors: userId, selectedContractor: null });
        const completedJobs = await eventCollection.find({ selectedContractor: userId, eventStatus: "completed" });
        const rejectedJobs = await eventCollection.find({ rejectedContractors: userId });

        res.status(200).json({ acceptedJobs, completedJobs, rejectedJobs });
    } catch (error) {
        console.error('Error fetching user jobs:', error);
        res.status(500).json({ message: 'Error fetching user jobs' });
    }
});

// Route to assign a contractor to an event
router.put('/assign-contractor/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { contractorId } = req.body;

    try {
        const event = await eventCollection.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Update assignedContractors and eventStatus
        event.assignedContractors = [contractorId];
        event.eventStatus = 'processing';
        await event.save();

        res.status(200).json({ message: 'Contractor assigned successfully', event });
    } catch (error) {
        console.error('Error assigning contractor:', error);
        res.status(500).json({ message: 'Error assigning contractor' });
    }
});

// Gets events within a certain date range
router.get("/eligible-events/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const fiftyDaysAgo = new Date();
        fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

        // Find events within the last 50 days, without an invoice, and assigned to the user
        const eligibleEvents = await eventCollection.find({
            eventLoadIn: { $gte: fiftyDaysAgo },
            invoiceGenerated: false,
            assignedContractors: userId,
        }).sort({ eventLoadIn: -1 });

        res.status(200).json(eligibleEvents);
    } catch (error) {
        console.error("Error fetching eligible events:", error);
        res.status(500).json({ message: "Server error while fetching eligible events." });
    }
});

// Add this new route to handle contractor applications
router.post('/:eventId/apply', async (req, res) => {
    const { eventId } = req.params;
    const { email } = req.body;

    try {
        // First, find the contractor by email
        const contractor = await userCollection.findOne({ email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        const event = await eventCollection.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        
        event.acceptedContractors.push(contractor._id);

        if (event.rejectedContractors.includes(contractor._id)) {
            event.rejectedContractors.pull(contractor._id);
        }

        await event.save();

        const newNotification = new notificationCollection({
            subject: "Event",
            text0: `User ${contractor.name} has accepted the event `,
            linkPath1: `/admin/corrections/${event?._id}`,
            linkText1: `${event?.eventName}`,
            forAdmin: true
        });
        await newNotification.save();

        res.status(200).json({ 
            message: 'Application successful',
            event: await event.populate('acceptedContractors', 'name email')
        });
    } catch (error) {
        console.error('Error applying to event:', error);
        res.status(500).json({ message: 'Error applying to event' });
    }
});

// Add new route to handle admin approval
router.post('/:eventId/approve', async (req, res) => {
    const { eventId } = req.params;
    const { contractorId, approved } = req.body;

    try {
        const event = await eventCollection.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (approved) {
            // Add to approvedContractors if not already there
            if (!event.approvedContractors.includes(contractorId)) {
                event.approvedContractors.push(contractorId);
            }
            // Remove from acceptedContractors (applied status)
            event.acceptedContractors = event.acceptedContractors.filter(
                id => id.toString() !== contractorId.toString()
            );
        } else {
            // If denied, remove from acceptedContractors
            event.acceptedContractors = event.acceptedContractors.filter(
                id => id.toString() !== contractorId.toString()
            );
            // Optionally add to rejectedContractors
            if (!event.rejectedContractors.includes(contractorId)) {
                event.rejectedContractors.push(contractorId);
            }
        }

        // Deletes the job comments the user had
        const jobComment = await userJobCommentCollection.findOne({
            userID: contractorId.toString(),
        });

        if (jobComment) {
            event.jobCommentCount -= 1;
            await userJobCommentCollection.deleteOne({
                _id: jobComment._id
            });
        }

        const newNotification = new notificationCollection({
            userID: contractorId,
            subject: "Event",
            text0: `You have been approved for `,
            linkPath1: `/user/corrections/${event?._id}`,
            linkText1: `${event?.eventName}`,
            forAdmin: false
        });
        await newNotification.save();

        await event.save();
        res.status(200).json({ message: 'Contractor status updated successfully' });
    } catch (error) {
        console.error('Error updating contractor status:', error);
        res.status(500).json({ message: 'Error updating contractor status' });
    }
});

// Add this new route to fetch approved events for a contractor
router.get('/approved/:email', async (req, res) => {
    try {
        // First, find the contractor by email
        const contractor = await userCollection.findOne({ email: req.params.email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        // Find all events where the contractor is in the approvedContractors array
        const approvedEvents = await eventCollection.find({
            approvedContractors: contractor._id
        });

        res.status(200).json(approvedEvents);
    } catch (error) {
        console.error('Error fetching approved events:', error);
        res.status(500).json({ message: 'Error fetching approved events' });
    }
});

// Gets user's approved events
router.get('/contractor/:email', async (req, res) => {
    try {
        const contractor = await userCollection.findOne({ email: req.params.email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        // Find events where contractor is in any of the relevant arrays
        const events = await eventCollection.find({
            $or: [
                { acceptedContractors: contractor._id },    // Applied events
                { approvedContractors: contractor._id },    // Approved events
                { rejectedContractors: contractor._id }     // Denied events
            ]
        });

        // Map events to include status
        const eventsWithStatus = events.map(event => {
            let status = 'pending';
            if (event.approvedContractors.includes(contractor._id)) {
                status = 'approved';
            } else if (event.rejectedContractors.includes(contractor._id)) {
                status = 'denied';
                // Add deniedAt timestamp if not present
                if (!event.deniedAt) {
                    event.deniedAt = new Date();
                    event.save();
                }
            } else if (event.acceptedContractors.includes(contractor._id)) {
                status = 'applied';
            }

            return {
                ...event.toObject(),
                status
            };
        });

        res.status(200).json(eventsWithStatus);
    } catch (error) {
        console.error('Error fetching contractor events:', error);
        res.status(500).json({ message: 'Error fetching contractor events' });
    }
});

// Update or add this route
router.get('/contractor/corrections/:email', async (req, res) => {
    try {
        const contractor = await userCollection.findOne({ email: req.params.email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        // Find events where contractor is in any of the relevant arrays
        const events = await eventCollection.find({
            $or: [
                { approvedContractors: contractor._id },    // Approved events
            ]
        });

        // Map events to include status
        const eventsWithStatus = events.map(event => {
            let status = 'pending';
            if (event.approvedContractors.includes(contractor._id)) {
                status = 'approved';
            } else if (event.rejectedContractors.includes(contractor._id)) {
                status = 'denied';
                // Add deniedAt timestamp if not present
                if (!event.deniedAt) {
                    event.deniedAt = new Date();
                    event.save();
                }
            } else if (event.acceptedContractors.includes(contractor._id)) {
                status = 'applied';
            }

            return {
                ...event.toObject(),
                status
            };
        });

        res.status(200).json(eventsWithStatus);
    } catch (error) {
        console.error('Error fetching contractor events:', error);
        res.status(500).json({ message: 'Error fetching contractor events' });
    }
});

// Get's user's approved events
router.get('/approved-events/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const approvedEvents = await eventCollection.find({ approvedContractors: userId });
        res.status(200).json(approvedEvents);
    } catch (error) {
        console.error('Error fetching approved events:', error);
        res.status(500).json({ message: 'Error fetching approved events' });
    }
});

// Gets user's eligible events within a certian time frame
router.get("/eligible-events/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const fiftyDaysAgo = new Date();
        fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

        // Find events within the last 50 days, without an invoice, and assigned to the user
        const eligibleEvents = await eventCollection.find({
            eventLoadIn: { $gte: fiftyDaysAgo }, // Only events within last 50 days
            invoiceGenerated: false, // No invoice has been generated yet
            assignedContractors: userId, // Ensure the user was part of the event
        }).sort({ eventLoadIn: -1 }); // Sort by latest events first

        res.status(200).json(eligibleEvents);
    } catch (error) {
        console.error("Error fetching eligible events:", error);
        res.status(500).json({ message: "Server error while fetching eligible events." });
    }
});

module.exports = router;

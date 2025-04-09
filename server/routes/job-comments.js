require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const router = express.Router();
const { eventCollection, userCollection, userJobCommentCollection, notificationCollection } = require('../mongo');

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

// Creates Job Comment
router.post('/:eventID/:email', async (req, res) => {
    const { jobComments } = req.body;
    const eventID = req.params.eventID;

    if (!jobComments) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    console.log('Request Params:', req.params);
    console.log('Request Body:', req.body);

    try {
        // First, find the contractor by email
        const user = await userCollection.findOne({ email: req.params.email });
        if (!user) {
            console.error('Contractor not found');
            return res.status(404).json({ message: 'Contractor not found' });
        }
        const userID = user._id

        const newJobComment = new userJobCommentCollection({
            eventID,
            userID,
            jobComments,
            createdAt: new Date(),
          });
      
        await newJobComment.save();

        const event = await eventCollection.findOne({ _id: eventID });
        if (!event) {
            console.error('Event not found');
            return res.status(404).json({ message: 'Event not found' });
        }
        event.jobCommentCount += 1;
        await event.save();

        const newNotification = new notificationCollection({
            userID: userID,
            text0: `New `,
            linkPath1: `/admin/job-comments/${newJobComment?._id}`,
            linkText1: `Job Comment`,
            text1: ` by ${user?.name} for event `,
            linkPath2: `/admin/events/${event?._id}`,
            linkText2: `${event?.eventName}`,
            forAdmin: true
        });

        await newNotification.save();

        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        console.error('Error fetching job comment information:', error);
        res.status(500).json({ message: 'Error fetching job comment information' });
    }
});

// Route to get all job comments of that event
router.get('/event/:eventId', async (req, res) => {
    try {
        const eventID = req.params.eventId;

        const jobComments = await userJobCommentCollection.find({
            eventID: eventID,
        });
        
        res.status(200).json({
            jobComments
        });        
    } catch (error) {
        console.error('Error fetching job comments:', error);
        res.status(500).json({ message: 'Error fetching job comments' });
    }
});

// Updates Job comment
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { jobComments } = req.body;

    if (!jobComments) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    console.log('Request Params:', req.params);
    console.log('Request Body:', req.body);

    try {
        const updatedData = {
            ...req.body,
            updatedAt: new Date()
        };

        const updatedComment = await userJobCommentCollection.findByIdAndUpdate(
            id,
            updatedData,
            { 
                new: true,
                overwrite: false,
                returnDocument: 'after'
            }
        );

        if (!updatedComment) {
            return res.status(404).json({ message: 'Event not found' });
        }
      
        res.status(200).json(updatedComment);
    } catch (error) {
        console.error('Error updating job comment information:', error);
        res.status(500).json({ message: 'Error updating job comment information' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        jobComment = await userJobCommentCollection.findById(req.params.id);

        const event = await eventCollection.findOne({ _id: jobComment.eventID });
        if (!event) {
            console.error('Event not found');
            return res.status(404).json({ message: 'Event not found' });
        }
        event.jobCommentCount -= 1;
        await event.save();

        await userJobCommentCollection.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Error deleting comment' });
    }
});

// Route to get all job comments
router.get('/', async (req, res) => {
    try {
        const jobComments = await userJobCommentCollection
            .find({})
            .select('-__v')  // Exclude version field
            .lean();  // Convert to plain JavaScript objects
        
        const users = await userCollection.find({}).select('-__v').lean();
        const events = await eventCollection.find({}).select('-__v').lean();
        
        res.status(200).json({
            jobComments,
            users,
            events
        });   
    } catch (error) {
        console.error('Error fetching job comments:', error);
        res.status(500).json({ message: 'Error fetching job comments' });
    }
});

// Route to get a single event
router.get('/:id([0-9a-fA-F]{24})', async (req, res) => {
    try {
        const jobComment = await userJobCommentCollection.findById(req.params.id)

        const user = await userCollection.findById(jobComment.userID);

        const event = await eventCollection.findById(jobComment.eventID);
            
        if (!jobComment) {
            return res.status(404).json({ message: 'Job comment not found' });
        }
        
        res.status(200).json({
            jobComment,
            userName: user.name,
            event
        });
    } catch (error) {
        console.error('Error fetching job comment:', error);
        res.status(500).json({ message: 'Error fetching job comment details' });
    }
});


// Route to get all corrections of that user
router.get('/:email', async (req, res) => {
    try {
        
        const contractor = await userCollection.findOne({ email: req.params.email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        const jobComments = await userJobCommentCollection.find({
            userID: contractor._id,
        });
        
        const events = await eventCollection.find({}).select('-__v').lean();
            
        res.status(200).json({
            jobComments,
            events
        });        
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Gets user's job comments for an event
router.get('/:eventID/:email', async (req, res) => {
    const eventID = req.params.eventID;

    try {
        // First, find the contractor by email
        const user = await userCollection.findOne({ email: req.params.email });
        if (!user) {
            console.error('Contractor not found');
            return res.status(404).json({ message: 'Contractor not found' });
        }

        const jobComment = await userJobCommentCollection.findOne({
            eventID: eventID,
            userID: user._id
        });
        
        if (!jobComment) {
            return res.status(404).json({ message: 'Job comment not found' });
        }
        res.status(200).json(jobComment);
    } catch (error) {
        console.error('Error fetching job comment information:', error);
        res.status(500).json({ message: 'Error fetching job comment information' });
    }
});

module.exports = router;

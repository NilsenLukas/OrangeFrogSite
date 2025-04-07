require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const router = express.Router();
const { eventCollection, userCollection, correctionReportCollection, notificationCollection, userJobCommentCollection } = require('../mongo');
// const UserDashboard = require('../../client/src/components/pages/freelancer/UserDashboard').default;

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

// Route to get all notifications of a user
router.get('/:email', async (req, res) => {
    try {
        
        const contractor = await userCollection.findOne({ email: req.params.email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        const notifications = await notificationCollection.find({
            userID: contractor._id,
        });
        
        const events = await eventCollection.find({}).select('-__v').lean();
        
        res.status(200).json({
            notifications,
            corrections,
            events
        });        
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Route to get all notifications of a user
router.get('/admin/:email', async (req, res) => {
    try {
        
        const contractor = await userCollection.findOne({ email: req.params.email });
        if (!contractor) {
            return res.status(404).json({ message: 'Contractor not found' });
        }

        const notifications = await notificationCollection.find({
            userID: req.params.email,
        });
        
        const users = await userCollection.find({}).select('-__v').lean();
        const events = await eventCollection.find({}).select('-__v').lean();
        const corrections = await correctionReportCollection.find({}).select('-__v').lean();
        const jobComments = await userJobCommentCollection.find({}).select('-__v').lean();
        
        res.status(200).json({
            notifications,
            users,
            events,
            corrections,
            jobComments
        });        
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});


module.exports = router;

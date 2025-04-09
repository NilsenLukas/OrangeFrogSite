const express = require('express');
const bcrypt = require('bcrypt');
const { Admin } = require('../mongo'); // Import the Admin schema
const router = express.Router();

// ✅ Get Admin Profile
router.get('/admin-profile/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        console.log(`Fetching admin profile for: ${email}`);

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const admin = await Admin.findOne({ email }).select('-password'); // Exclude password

        if (!admin) {
            console.warn(`Admin with email ${email} not found.`);
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ message: 'Error fetching admin profile' });
    }
});

router.get('/admin-profile', async (req, res) => {
    try {
        const admin = await Admin.findOne().select('-password'); // Exclude password
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        res.json(admin);
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ message: "Error fetching admin profile" });
    }
});

// ✅ Update Admin Profile
router.put('/admin-profile/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const { address } = req.body;

        console.log(`Updating admin profile for: ${email}`);

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const admin = await Admin.findOneAndUpdate(
            { email },
            { address },
            { new: true }
        ).select('-password'); // Exclude password

        if (!admin) {
            console.warn(`Admin with email ${email} not found.`);
            return res.status(404).json({ message: 'Admin not found' });
        }

        const newNotification = new notificationCollection({
            text1: `Update to admin profile ${admin?.email}`,
            forAdmin: true
        });
    
        await newNotification.save();

        res.json({ message: 'Profile updated successfully', admin });
    } catch (error) {
        console.error("Error updating admin profile:", error);
        res.status(500).json({ message: 'Error updating admin profile' });
    }
});

// ✅ Change Admin Password
router.put('/update-admin-profile/:email/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findOne({ email: req.params.email });

        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        // Validate current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        // Hash new password and update
        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();

        const newNotification = new notificationCollection({
            text1: `Update to password of admin ${admin?.email}`,
            forAdmin: true
        });
    
        await newNotification.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password' });
    }
});

module.exports = router;
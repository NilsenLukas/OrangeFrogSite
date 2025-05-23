// Update profile routes
require('dotenv').config();
const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const { userCollection } = require('../mongo');

// Updates user info
router.put('/:email', async (req, res) => {
    const { email } = req.params;
    const { name, address, dob, phone, shirtSize, firstAidCert, allergies, foodAllergyDetail, currentPassword, newPassword } = req.body;

    try {
        const user = await userCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hasChanges = 
            name !== user.name ||
            address !== user.address ||
            dob !== user.dob ||
            phone !== user.phone ||
            shirtSize !== user.shirtSize ||
            firstAidCert !== user.firstAidCert ||
            JSON.stringify(allergies) !== JSON.stringify(user.allergies) ||
            (currentPassword && newPassword);

        if (!hasChanges) {
            return res.status(400).json({ message: 'No changes detected' });
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        user.name = name || user.name;
        user.address = address || user.address;
        user.dob = dob || user.dob;
        user.phone = phone || user.phone;
        user.shirtSize = shirtSize || user.shirtSize;
        user.firstAidCert = firstAidCert || user.firstAidCert;
        user.allergies = allergies || user.allergies;
        user.foodAllergyDetail = allergies.includes('Food Allergy') ? foodAllergyDetail : '';

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Updates password
router.put('/:email/password', async (req, res) => {
    const { email } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await userCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

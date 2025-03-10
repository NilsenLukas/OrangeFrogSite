const express = require("express");
const router = express.Router();
const { TimeTracking } = require("../mongo");

// ✅ 1. Clock In
router.post("/clock-in", async (req, res) => {
    try {
        const { userId, eventId } = req.body;

        // Check if user is already clocked in
        const existingClockIn = await TimeTracking.findOne({ userId, isClockedIn: true });
        if (existingClockIn) {
            return res.status(400).json({ message: "User is already clocked in." });
        }

        // Create a new clock-in entry
        const newClockIn = new TimeTracking({
            userId,
            eventId,
            clockInTime: new Date(),
            isClockedIn: true,
        });

        await newClockIn.save();
        res.status(201).json({ message: "Clocked in successfully.", timeTracking: newClockIn });
    } catch (error) {
        console.error("Error clocking in:", error);
        res.status(500).json({ message: "Server error while clocking in." });
    }
});

// ✅ 2. Clock Out
router.put("/clock-out/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Find active clock-in entry
        const clockInEntry = await TimeTracking.findOne({ userId, isClockedIn: true });

        if (!clockInEntry) {
            return res.status(400).json({ message: "User is not clocked in." });
        }

        // Check if the user has been clocked in for more than 24 hours
        const now = new Date();
        const clockInDuration = (now - clockInEntry.clockInTime) / (1000 * 60 * 60); // Convert ms to hours
        if (clockInDuration > 24) {
            return res.status(400).json({ message: "Clock-in session exceeded 24 hours. Clocking out automatically." });
        }

        // Update clock-out time
        clockInEntry.clockOutTime = now;
        clockInEntry.isClockedIn = false;
        await clockInEntry.save();

        res.status(200).json({ message: "Clocked out successfully.", timeTracking: clockInEntry });
    } catch (error) {
        console.error("Error clocking out:", error);
        res.status(500).json({ message: "Server error while clocking out." });
    }
});

// Start Break
router.put("/start-break/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const clockInEntry = await TimeTracking.findOne({ userId, isClockedIn: true });

        if (!clockInEntry) {
            return res.status(400).json({ message: "User is not clocked in." });
        }

        if (clockInEntry.isOnBreak) {
            return res.status(400).json({ message: "User is already on a break." });
        }

        // Append a new break session to the breaks array
        clockInEntry.breaks.push({ breakStartTime: new Date() });
        clockInEntry.isOnBreak = true;
        await clockInEntry.save();

        res.status(200).json({ message: "Break started successfully.", timeTracking: clockInEntry });
    } catch (error) {
        console.error("Error starting break:", error);
        res.status(500).json({ message: "Server error while starting break." });
    }
});

//  End the Most Recent Break
router.put("/end-break/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const clockInEntry = await TimeTracking.findOne({ userId, isClockedIn: true, isOnBreak: true });

        if (!clockInEntry) {
            return res.status(400).json({ message: "User is not on a break." });
        }

        // Find the last break session in the array and update its breakEndTime
        const lastBreak = clockInEntry.breaks[clockInEntry.breaks.length - 1];
        if (!lastBreak || lastBreak.breakEndTime) {
            return res.status(400).json({ message: "No active break to end." });
        }

        lastBreak.breakEndTime = new Date();
        clockInEntry.isOnBreak = false;
        await clockInEntry.save();

        res.status(200).json({ message: "Break ended successfully.", timeTracking: clockInEntry });
    } catch (error) {
        console.error("Error ending break:", error);
        res.status(500).json({ message: "Server error while ending break." });
    }
});

// ✅ 5. Get Clock-In Status (Check if User is Clocked In)
router.get("/status/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const clockInEntry = await TimeTracking.findOne({ userId, isClockedIn: true });

        if (!clockInEntry) {
            return res.status(200).json({ isClockedIn: false });
        }

        res.status(200).json({ isClockedIn: true, timeTracking: clockInEntry });
    } catch (error) {
        console.error("Error checking clock-in status:", error);
        res.status(500).json({ message: "Server error while checking status." });
    }
});

module.exports = router;
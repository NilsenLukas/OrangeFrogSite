// time-tracking routes
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

// ✅ 2. Clock Out (Handles 24-Hour Limit)
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
            console.log("User exceeded 24-hour clock-in period. Auto clocking out.");

            // ✅ Automatically force clock-out
            clockInEntry.clockOutTime = now;
            clockInEntry.isClockedIn = false;
            await clockInEntry.save();

            return res.status(200).json({ message: "User was automatically clocked out due to exceeding 24 hours.", timeTracking: clockInEntry });
        }

        // Normal clock-out process
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

// Ends the Most Recent Break
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

// ✅ Get Time Tracking Records for a Specific Event and User
router.get("/event/:eventId/:userId", async (req, res) => {
    try {
        const { eventId, userId } = req.params;
        const timeEntries = await TimeTracking.find({ eventId, userId });

        if (!timeEntries || timeEntries.length === 0) {
            return res.status(404).json({ message: "No time tracking records found for this event and user." });
        }

        res.status(200).json(timeEntries);
    } catch (error) {
        console.error("Error fetching time tracking data:", error);
        res.status(500).json({ message: "Server error while fetching time tracking data." });
    }
});

// Gets clock in and out history
router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    const { date } = req.query;

    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // ✅ Fetch all time-tracking records within the selected date range
        const records = await TimeTracking.find({
            userId,
            clockInTime: { $gte: startOfDay, $lte: endOfDay }
        });

        res.json({
            clockHistory: records.map(record => ({
                type: "Clock In",
                time: record.clockInTime
            })).concat(
                records.filter(record => record.clockOutTime).map(record => ({
                    type: "Clock Out",
                    time: record.clockOutTime
                }))
            ),
            breaks: records.flatMap(record => record.breaks || [])
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching time-tracking history." });
    }
});

module.exports = router;
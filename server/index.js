require('dotenv').config();
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const { userCollection, eventCollection, Admin } = require('./mongo');
const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.json());
app.use(cors());


// Gets routes 
const usersRoute = require("./routes/users");
const createUserRoute = require("./routes/create-user");
const loginRoute = require("./routes/login");
const resetPasswordRoute = require("./routes/reset-password");
const completeProfileRoute = require("./routes/complete-profile");
const deleteUserRoute = require("./routes/delete-user");
const userProfileRoute = require("./routes/user-profile");
const updateProfileRoute = require("./routes/update-profile");
const createEventRoute = require("./routes/create-event");
const eventsRoute = require("./routes/events");
const forgotPasswordRoute = require("./routes/forgot-password");
const logoutRoute = require("./routes/logout");
const correctionReportRouter = require('./routes/correction-report');
const invoicesRoute = require('./routes/invoices');
const viewCorrectionsRoute = require("./routes/view-corrections");
const adminRoutes = require("./routes/admin");
const timeTrackingRoutes = require("./routes/timeTracking");
const jobCommentRoutes = require("./routes/job-comments");
const notificationRoutes = require("./routes/notifications");

// Sets up paths for each route
app.use("/users", usersRoute);
app.use("/update-user", userProfileRoute);
app.use("/create-user", createUserRoute);
app.use("/resend-email", createUserRoute);
app.use("/login", loginRoute);
app.use("/reset-password", resetPasswordRoute);
app.use("/complete-profile", completeProfileRoute);
app.use("/delete-user/", deleteUserRoute);
app.use("/user-profile/", userProfileRoute);
app.use("/update-profile", updateProfileRoute);
app.use("/create-event", createEventRoute);
app.use("/events", eventsRoute);
app.use("/forgot-password", forgotPasswordRoute);
app.use("/logout", logoutRoute);
app.use('/correction-report', correctionReportRouter);
app.use('/invoices', invoicesRoute);
app.use("/corrections", viewCorrectionsRoute);
app.use("/time-tracking", timeTrackingRoutes);
app.use("/admin", adminRoutes);
app.use("/job-comments", jobCommentRoutes)
app.use("/notifications", notificationRoutes)

app.use("/health", (req, res) => {
  res.status(200).send("App is running!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.post('/validate-session', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token
  const { sessionId } = req.body;

  if (!token || !sessionId) {
      return res.status(401).json({ valid: false, message: "Unauthorized" });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID
      const user = await userCollection.findOne({ _id: decoded.userId });

      if (!user || user.sessionId !== sessionId) {
          return res.status(401).json({ valid: false, message: "Session mismatch" });
      }

      res.json({ valid: true });

  } catch (error) {
      res.status(401).json({ valid: false, message: "Invalid token" });
  }
});



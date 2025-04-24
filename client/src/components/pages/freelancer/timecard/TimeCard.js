// User Time card page
// Allows user to clock in and out of events/jobs
import React, { useState, useEffect, useContext } from "react";
import Calendar from 'react-calendar';
import { Link } from "react-router-dom";
import 'react-calendar/dist/Calendar.css';
import { AuthContext } from "../../../../AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import './TimeCard.css';
import { FaClock, FaSignOutAlt, FaCoffee, FaPause } from 'react-icons/fa';

const TimeCard = () => {
    const { auth } = useContext(AuthContext);
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);   
    const [breaks, setBreaks] = useState([]); 
    const [clockHistory, setClockHistory] = useState([]);

    useEffect(() => {
        const fetchApprovedEvents = async () => {
            try {
                // Gets user's approved events
                const response = await fetch(`${process.env.REACT_APP_BACKEND}/events/contractor/${auth.email}`);
                if (response.ok) {
                    const data = await response.json();
                    const approved = data.filter(event => event.status === 'approved');
                    setApprovedEvents(approved);
                    const today = new Date();
                    setSelectedDate(today);           // ✅ This visually highlights today on calendar
                    handleDateClick(today);           // ✅ This loads today's events
                } else {
                    toast.error("Failed to fetch events");
                }
            } catch (error) {
                console.error('Error fetching approved events:', error);
                toast.error("Error loading events");
            } finally {
                setIsLoading(false);
            }
        };

        fetchApprovedEvents();
    }, [auth.email]);

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const isEventDate = approvedEvents.some(event => 
                new Date(event.eventLoadIn).toDateString() === date.toDateString() ||
                new Date(event.eventLoadOut).toDateString() === date.toDateString()
            );

            if (isEventDate) return 'event-date';
        }
        return null;
    };

    const handleDateClick = async (date) => {
        setSelectedDate(date);
    
        // Filter events for the selected date
        const eventsForDate = approvedEvents.filter(event => {
            const loadInDate = new Date(event.eventLoadIn).toDateString();
            const loadOutDate = new Date(event.eventLoadOut).toDateString();
            return loadInDate === date.toDateString() || loadOutDate === date.toDateString();
        }).map(event => ({
            ...event,
            type: new Date(event.eventLoadIn).toDateString() === date.toDateString() ? 'Load In' : 'Load Out',
            hours: new Date(event.eventLoadIn).toDateString() === date.toDateString() 
                ? event.eventLoadInHours 
                : event.eventLoadOutHours,
            time: new Date(event.eventLoadIn).toDateString() === date.toDateString()
                ? new Date(event.eventLoadIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date(event.eventLoadOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    
        setSelectedDateEvents(eventsForDate);
    
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/time-tracking/history/${auth.userId}?date=${date.toISOString()}`);
            if (response.ok) {
                const data = await response.json();
                
                const mergedTimeline = [
                    ...data.clockHistory.map(entry => ({
                        type: entry.type,
                        time: new Date(entry.time),
                    })),
                    ...data.breaks.flatMap(breakSession => [
                        { type: "Break Start", time: new Date(breakSession.breakStartTime) },
                        breakSession.breakEndTime
                            ? { type: "Break End", time: new Date(breakSession.breakEndTime) }
                            : null
                    ]).filter(Boolean) // Remove null values
                ].sort((a, b) => a.time - b.time); // ✅ Sort by time
    
                setClockHistory(mergedTimeline); // ✅ Now, all events are in order
            } else {
                toast.error("Failed to load time history for the selected date.");
                setClockHistory([]);
                setBreaks([]);
            }
        } catch (error) {
            console.error("Error fetching time history:", error);
            toast.error("Server error while loading history.");
            setClockHistory([]);
            setBreaks([]);
        }
    };

    useEffect(() => {
        const fetchClockInStatus = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_BACKEND}/time-tracking/status/${auth.userId}`);
                const data = await response.json();
    
                if (data.isClockedIn) {
                    setIsClockedIn(true);
                    setBreaks(data.timeTracking.breaks || []);
    
                    if (data.timeTracking.isOnBreak) {
                        setIsOnBreak(true);
                    }
                } else {
                    setIsClockedIn(false);
                    setBreaks([]);
                }
            } catch (error) {
                console.error("Error fetching clock-in status:", error);
            }
        };
    
        if (auth.userId) {
            fetchClockInStatus();
        }
    }, [auth.userId]);
    
    const handleClockIn = async () => {
        if (selectedDateEvents.length === 0) {
            toast.error("No event selected for clock-in.");
            return;
        }
    
        const eventToClockIn = selectedDateEvents[0];
        const today = new Date().toDateString();

        const isToday =
            new Date(eventToClockIn.eventLoadIn).toDateString() === today ||
            new Date(eventToClockIn.eventLoadOut).toDateString() === today;

        if (!isToday) {
            toast.error("You can only clock in for today's event.");
            return;
        }
        
        try {
            // Clocks in user
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/time-tracking/clock-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: auth.userId, eventId: eventToClockIn._id })
            });
    
            const data = await response.json();
    
            if (response.status === 201) {
                const newClockInTime = new Date(data.timeTracking.clockInTime);
                setIsClockedIn(true);
                setClockInTime(newClockInTime);
                
                setClockHistory((prevHistory) => [
                    ...prevHistory,
                    { type: "Clock In", time: newClockInTime }
                ]);
    
                toast.success("Clocked in successfully at " + newClockInTime.toLocaleTimeString());
            } else {
                toast.error(data.message || "Failed to clock in.");
            }
        } catch (error) {
            console.error("Error clocking in:", error);
            toast.error("Server error while clocking in.");
        }
    };
    
    const handleClockOut = async () => {
        try {
            // Clocks out user
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/time-tracking/clock-out/${auth.userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });
    
            const data = await response.json();
    
            if (response.status === 200) {
                const newClockOutTime = new Date();
                setIsClockedIn(false);
                setIsOnBreak(false);
                setBreaks([]);
    
                setClockHistory((prevHistory) => [
                    ...prevHistory,
                    { type: "Clock Out", time: newClockOutTime }
                ]);
    
                toast.success(data.message);
            } else {
                toast.error(data.message || "Failed to clock out.");
            }
        } catch (error) {
            console.error("Error clocking out:", error);
            toast.error("Server error while clocking out.");
        }
    };
    
    const handleStartBreak = async () => {
        try {
            // Starts break
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/time-tracking/start-break/${auth.userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });
    
            const data = await response.json();
    
            if (response.status === 200) {
                setIsOnBreak(true);
                setBreaks([...breaks, { breakStartTime: new Date() }]);
                handleDateClick(selectedDate); // ✅ refresh timeline
            } else {
                toast.error(data.message || "Failed to start break.");
            }
        } catch (error) {
            console.error("Error starting break:", error);
            toast.error("Server error while starting break.");
        }
    };
    
    const handleEndBreak = async () => {
        try {
            // Ends break
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/time-tracking/end-break/${auth.userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });
    
            const data = await response.json();
    
            if (response.status === 200) {
                setIsOnBreak(false);
    
                // Update last break session with the end time
                setBreaks((prevBreaks) => {
                    const updatedBreaks = [...prevBreaks];
                    updatedBreaks[updatedBreaks.length - 1].breakEndTime = new Date();
                    return updatedBreaks;
                });
                handleDateClick(selectedDate);
            } else {
                toast.error(data.message || "Failed to end break.");
            }
        } catch (error) {
            console.error("Error ending break:", error);
            toast.error("Server error while ending break.");
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen p-8 bg-neutral-900">
            <Link 
                to="/user/dashboard"
                className="mb-8 flex items-center text-neutral-400 hover:text-white transition-colors"
            >
                <svg 
                    className="w-5 h-5 mr-2" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path d="M15 19l-7-7 7-7" />
                </svg>
                Return to Dashboard
            </Link>

            <div className="flex justify-between items-center mb-12">
                <div className="w-24"> {/* Spacer div */}</div>
                    <h1 className="text-3xl font-bold text-white text-center">Time Card</h1>
                <div className="flex space-x-2 items-center w-24"> {/* Fixed width to match left spacer */}
                </div>
            </div>

            {isLoading ? (
                <motion.div
                    className="w-16 h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            ) : (
                <div className="flex flex-col items-center gap-8  max-w-7xl mx-auto">
    {/* Calendar Section - Full Width */}
    <motion.div
        className="calendar-container w-full flex justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        <Calendar
            tileClassName={tileClassName}
            className="react-calendar w-full max-w-4xl text-white"
            onClickDay={handleDateClick}
            value={selectedDate}
        />
    </motion.div>

    {/* Event Details Section - Below Calendar & Centered */}
    <motion.div
        className="event-details-container w-full max-w-2xl flex flex-col items-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        {selectedDateEvents.length > 0 ? (
            <div className="space-y-4 w-full flex flex-col items-center">
                {selectedDateEvents.map((event, index) => {
                    const eventDate = new Date(event.eventLoadIn).toDateString();
                    const todayDate = new Date().toDateString();
                    const isToday = eventDate === todayDate;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="event-card p-4 bg-neutral-800 rounded-lg shadow-lg w-full"
                        >
                            <h3 className="text-lg text-white font-bold mb-4 text-center">
                                {event.eventName}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-center">
                                <div>
                                    <span className="text-neutral-400">Type:</span>
                                    <span className="ml-2 text-white">{event.type}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-400">Start Time:</span>
                                    <span className="ml-2 text-white">{event.time}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-400">Hours:</span>
                                    <span className="ml-2 text-white">{event.hours}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-400">Location:</span>
                                    <span className="ml-2 text-white">{event.eventLocation}</span>
                                </div>
                            </div>

                            {/* Clock In/Out and Break Buttons */}
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                {/* Clock In Button - Disabled if Not Today's Event */}
                                {!isClockedIn && (
                                    <button
                                        onClick={handleClockIn}
                                        disabled={!(new Date(event.eventLoadIn).toDateString() === new Date().toDateString() ||
                                                    new Date(event.eventLoadOut).toDateString() === new Date().toDateString())}
                                        className={`px-4 py-2 rounded-full flex items-center justify-center gap-2 w-[160px] 
                                            ${(new Date(event.eventLoadIn).toDateString() === new Date().toDateString() ||
                                            new Date(event.eventLoadOut).toDateString() === new Date().toDateString())
                                                ? "bg-black text-white"
                                                : "bg-neutral-700 text-neutral-500 cursor-not-allowed"}`}
                                    >
                                        <FaClock /> Clock In
                                    </button>
                                )}
                                {isClockedIn && (
                                    <>
                                        {!isOnBreak && (
                                            <button
                                                onClick={handleClockOut}
                                                className="bg-black text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 w-[160px]"
                                            >
                                                <FaSignOutAlt /> Clock Out
                                            </button>
                                        )}
                                        {!isOnBreak ? (
                                            <button
                                                onClick={handleStartBreak}
                                                className="bg-black text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 w-[160px]"
                                            >
                                                <FaCoffee /> Start Break
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleEndBreak}
                                                className="bg-black text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 w-[160px]"
                                            >
                                                <FaPause /> End Break
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            {/* Show Break History */}
                            {/* {breaks.length > 0 && ( */}
                                <>
                                {/* Show Clock-In, Break, and Clock-Out History in Order */}
                                <div className="w-full text-center mt-6">
                                    <h4 className="text-white text-sm font-bold mb-2">Clock & Break History for {selectedDate?.toLocaleDateString()}:</h4>
                                </div>

                                <div className="mt-2 flex justify-center">
                                    <ul className="text-neutral-400 text-sm space-y-1 text-center">
                                        {/* ✅ Sorted timeline display */}
                                        {clockHistory.map((entry, index) => (
                                            <li key={index}>
                                                {entry.type === "Clock In" && "⏰"} 
                                                {entry.type === "Clock Out" && "🚪"} 
                                                {entry.type === "Break Start" && "☕"} 
                                                {entry.type === "Break End" && "🔙"} 

                                                {` ${entry.type}: ${entry.time.toLocaleTimeString()}`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                </>
                            {/* )} */}
                        </motion.div>
                    );
                })}
            </div>
        ) : (
            <p className="text-neutral-400 text-center">No events scheduled for this date.</p>
        )}
    </motion.div>
</div>
            )}
        </div>
    );
};

export default TimeCard;
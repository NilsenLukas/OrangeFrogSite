// Generate Invoice Page
// Generates an invoice for the user and allows them to add & edit or remove information
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, Link } from "react-router-dom"; //useLocation
import { FaDownload, FaEdit, FaSave, FaTimes, FaPlus, FaTrashAlt } from "react-icons/fa";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import axios from 'axios';
import Modal from "../../Modal";
// import { format } from "date-fns";
import { AuthContext } from "../../../AuthContext";
import { parseDate } from "../../../utils/dateUtils"; 
import { toast } from 'sonner';
import { useLocation } from "react-router-dom";

pdfMake.vfs = pdfFonts.vfs;

const Invoice = ({invoiceData}) => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null); // Invoice state
  const invoiceRef = useRef(); // Reference for PDF generation
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const { auth } = useContext(AuthContext);
  const [newRow, setNewRow] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("eventId");
  const isNewInvoice = !id && !!eventId;
  const [adminData, setAdminData] = useState(null);

  // If neither ID nor eventId is present, log an error for debugging
  useEffect(() => {
      if (!id && !eventId) {
          console.error("Invoice ID and Event ID are both undefined.");
      }
  }, [id, eventId]);

  useEffect(() => {
      const fetchInvoiceData = async () => {
        if (!eventId) {
          console.warn("Event ID is missing, using default mode");
          return;
        }

          try {
            // Fetches event data
            const eventRes = await fetch(`${process.env.REACT_APP_BACKEND}/events/${eventId}`);
            const eventData = await eventRes.json();
            // console.log("Fetched Event Data:", eventData);

            // Fetch user data (Assuming user is logged in)
            const userRes = await fetch(`${process.env.REACT_APP_BACKEND}/users/${auth.userId}`);
            if (userRes.status === 401) {
                console.warn("Session expired. Staying on current page.");
                return; // Prevents redirecting to login
            }
            const userData = await userRes.json();
            // console.log("Fetched User Data:", userData);

            // Fetch admin data (Company info)
            const adminRes = await fetch(`${process.env.REACT_APP_BACKEND}/admin/admin-profile`);
            const adminData = await adminRes.json();
            // console.log("Fetched Admin Data:", adminData);

            // Fetch time tracking records for this event
            const timeRes = await fetch(`${process.env.REACT_APP_BACKEND}/time-tracking/event/${eventId}/${auth.userId}`);
            const timeData = await timeRes.json();
            console.log("Fetched Time Tracking Data:", timeData);

            // If no clock-in data exists, fallback to an empty row to let users enter manually
            const hasTimeData = Array.isArray(timeData) && timeData.length > 0;

              // Pre-fill invoice data
              // Ensure items array is populated correctly from time tracking data
              setInvoice({
                invoiceNumber: "", 
                lpoNumber: "", 
                user: userData,
                show: eventData.eventName,
                venue: eventData.eventLocation || "Detroit Mercy",
                dateOfWork: hasTimeData ? timeData.map(entry => entry.clockInTime) : [new Date().toISOString()],
                rate: [Number(userData.hourlyRate) || 0],
                totals: hasTimeData ? timeData.map(entry => (entry.billableHours * (userData.hourlyRate || 0)).toFixed(2)) : [0],
                items: hasTimeData
                  ? timeData.map((entry) => {
                      const formatTime = (date) =>
                        new Date(date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
              
                      const actualHours = `${formatTime(entry.clockInTime)} - ${
                        entry.clockOutTime ? formatTime(entry.clockOutTime) : 'Ongoing'
                      }`;
              
                      let workedMinutes = entry.clockOutTime
                        ? Math.max(
                            (new Date(entry.clockOutTime) - new Date(entry.clockInTime)) / (1000 * 60),
                            0
                          )
                        : 0;
              
                      let breakMinutes =
                        entry.breaks?.reduce((total, b) => {
                          if (b.breakStartTime && b.breakEndTime) {
                            return (
                              total +
                              Math.max(
                                (new Date(b.breakEndTime) - new Date(b.breakStartTime)) / (1000 * 60),
                                0
                              )
                            );
                          }
                          return total;
                        }, 0) || 0;
              
                      const billableHours = ((workedMinutes - breakMinutes) / 60).toFixed(2);
                      const rate = parseFloat(userData.hourlyRate) || 0;
                      const total = (parseFloat(billableHours) * rate).toFixed(2);
              
                      return {
                        date: entry.clockInTime
                          ? new Date(entry.clockInTime).toLocaleDateString()
                          : 'N/A',
                        actualHours,
                        notes: '',
                        billableHours,
                        rate,
                        total,
                      };
                    })
                    : [
                      {
                        date: new Date().toLocaleDateString(),
                        actualHours: '',
                        notes: '',
                        billableHours: '',
                        rate: Number(userData.hourlyRate) || 0,
                        total: 0,
                      },
                    ],
                subtotal: hasTimeData
                  ? timeData.reduce((sum, e) => sum + (e.billableHours * (userData.hourlyRate || 0)), 0)
                  : 0,
                taxPercentage: 10,
                taxAmount: hasTimeData
                  ? (
                      timeData.reduce((sum, e) => sum + (e.billableHours * (userData.hourlyRate || 0)), 0) *
                      0.1
                    ).toFixed(2)
                  : 0,
                total: hasTimeData
                  ? (
                      timeData.reduce(
                        (sum, e) =>
                          sum +
                          ((parseFloat(e.billableHours) || 0) * (parseFloat(userData.hourlyRate) || 0)),
                        0
                      ) * 1.1
                    ).toFixed(2)
                  : 0,
                notes: [],
                createdAt: new Date(),
              });

          } catch (error) {
              console.error("Error fetching invoice data:", error);
          }
      };

      fetchInvoiceData();
  }, [eventId]);

  const generatePDF = () => {
    const invoiceElement = invoiceRef.current;
  
    if (!invoiceElement) {
      console.error("Invoice reference not found");
      return;
    }
  
    if (!invoice) {
      console.error("Invoice data is not loaded");
      return;
    }
  
    const docDefinition = {
      content: [
        { text: 'INVOICE', style: 'header' },
        {
          columns: [
            [
              { text: 'Return Address:', bold: true },
              { text: invoice.user?.name || 'Sender Name', bold: true },
              { text: invoice.user?.address || 'Sender Address' },
              { text: `Phone: ${invoice.user?.phone || 'Sender Phone'}` },
              { text: `Email: ${invoice.user?.email || 'Sender Email'}` }
            ],
            [
              { text: 'Bill to:', bold: true },
              { text: adminData?.address || 'N/A' },
              { text: adminData?.email || 'N/A', bold: true }
            ]
          ]
        },
        {
          margin: [0, 20, 0, 0],
          columns: [
            { text: `Invoice #: ${invoice.invoiceNumber || 'N/A'}`, alignment: 'left' },
            { text: `Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, alignment: 'right' }
          ]
        },
  
        // Table for Invoice Items
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Date of Work', bold: true },
                { text: 'Actual Hours Worked', bold: true },
                { text: 'Notes', bold: true },
                { text: 'Billable Hours', bold: true },
                { text: 'Rate', bold: true },
                { text: 'Total', bold: true }
              ],
              ...invoice.dateOfWork.map((date, index) => [
                new Date(date).toLocaleDateString(),
                invoice.actualHoursWorked?.[index] ?? 'N/A',
                invoice.notes?.[index] ?? 'N/A',
                invoice.billableHours?.[index] ?? 'N/A',
                invoice.rate?.[index] !== undefined ? `$${invoice.rate[index].toFixed(2)}` : 'N/A',
                invoice.totals?.[index] !== undefined ? `$${invoice.totals[index].toFixed(2)}` : 'N/A'
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
  
        // Additional Details Outside the Table
        {
          margin: [0, 20, 0, 0],
          text: [
            { text: `Subtotal: `, bold: true },
            { text: `$${invoice.subtotal?.toFixed(2) ?? '0.00'}` }
          ]
        },
        {
          text: [
            { text: `Tax: `, bold: true },
            { text: `${invoice.taxPercentage ?? '0'}%` }
          ]
        },
        {
          text: [
            { text: `Sales Tax: `, bold: true },
            { text: `$${invoice.taxAmount?.toFixed(2) ?? '0.00'}` }
          ]
        },
        {
          text: [
            { text: `TOTAL: `, bold: true, fontSize: 14 },
            { text: `$${invoice.total?.toFixed(2) ?? '0.00'}`, fontSize: 14 }
          ],
          margin: [0, 5, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        }
      }
    };
  
    pdfMake.createPdf(docDefinition).download(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

//   const formattedDate = (date) => {
//     // console.log("Checking date:", date); // Debugging

//     if (!date) {
//         console.error("Invalid date found:", date);
//         return "Invalid Date";
//     }

//     // If date is an array, extract the first element
//     const parsedDate = Array.isArray(date) ? date[0] : date;
    
//     try {
//         const formatted = format(new Date(parsedDate), "MM/dd/yyyy h:mm a");
//         return formatted;
//     } catch (error) {
//         console.error("Date parsing error:", error, "with value:", parsedDate);
//         return "Invalid Date";
//     }
// };

const handleDelete = (index) => {
  setItemToDelete(index);
  setShowDeletePopup(true);
};

const confirmDelete = async () => {
  if (itemToDelete === null || !invoice) return;

  // console.log("Attempting to delete item at index:", itemToDelete);
  // console.log("Invoice ID:", id);
  // console.log("Total items in invoice:", invoice.items.length);

  // Prevent sending an invalid index
  if (itemToDelete >= invoice.items.length || itemToDelete < 0) {
      console.error("Invalid item index:", itemToDelete);
      toast.error("Invalid row selection. Please refresh and try again.");
      return;
  }

  try {
    if (isNewInvoice) {
      // Locally remove the item
      const updatedItems = invoice.items.filter((_, i) => i !== itemToDelete);
      setInvoice((prev) => ({ ...prev, items: updatedItems }));
      setShowDeletePopup(false);
      toast.success("Row removed locally!");
      return;
    }
    
    // Existing Invoice → Delete from Database
    const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND}/invoices/${id}/item/${itemToDelete}`
    );

      if (response.status === 200) {
          // console.log("Item deleted successfully:", response.data);

          // ✅ Remove deleted row from local state
          const updatedItems = invoice.items.filter((_, i) => i !== itemToDelete);
          setInvoice(prev => ({ ...prev, items: updatedItems }));

          setShowDeletePopup(false);
          toast.success("Row deleted successfully!");

          setTimeout(() => {
            window.location.reload();
          }, 500);
      } else {
          toast.error("Failed to delete row. Please try again.");
      }
  } catch (error) {
      console.error("Error deleting row:", error);
      toast.error("Failed to delete row. Please try again.");
  }
};

  useEffect(() => {
  if (!id) return; // Prevents fetching if invoice ID is missing

  const fetchInvoice = async () => {
    try {
      // Fetch admin data (Company info)
      const adminRes = await fetch(`${process.env.REACT_APP_BACKEND}/admin/admin-profile`);
      const adminData = await adminRes.json();
      setAdminData(adminData);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
    try {
      // Feteches invoice data
      const response = await fetch(`${process.env.REACT_APP_BACKEND}/invoices/${id}`);
      if (!response.ok) {
        console.error(`Error fetching invoice: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      console.log("Notes:", data.notes);

      // Ensure items array exists
      if (!data.items) {
        data.items = data.dateOfWork.map((date, index) => ({
          date: date || "N/A",
          actualHours: data.actualHoursWorked[index] || "N/A",
          notes: data.notes[index] || "N/A",
          billableHours: data.billableHours[index] || "N/A",
          rate: data.rate[index] || 0,
          total: data.totals[index] || 0
        }));
      }

      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  };

  fetchInvoice();
}, [id]);

  const handleEdit = (index) => {
    setEditingRow(index);
    setEditedData({
      ...invoice.items[index],
      date: invoice.items[index].date || "", // Convert to MM/DD/YYYY format when entering edit mode
    });
  };

  const handleSave = async (index) => {
    try {
        // Validate Date Format
        if (!editedData.date || !/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(editedData.date)) {
            toast.error("Invalid Date Format. Use MM/DD/YYYY (e.g., 12/15/2024).");
            return;
        }

        // Ensure Billable Hours & Rate are valid numbers
        if (isNaN(editedData.billableHours) || Number(editedData.billableHours) <= 0) {
            toast.error("Billable Hours must be a positive number.");
            return;
        }

        if (isNaN(editedData.rate) || Number(editedData.rate) <= 0) {
            toast.error("Rate must be a positive number.");
            return;
        }

        const updatedItems = [...invoice.items];

        updatedItems[index] = {
            ...editedData,
            date: parseDate(editedData.date, "MM/DD/YYYY", true), // Convert only if necessary
            actualHours: editedData.actualHours ?? "",
            notes: editedData.notes ?? "",
            billableHours: isNaN(Number(editedData.billableHours)) ? 0 : Number(editedData.billableHours),            
            rate: Number(Array.isArray(editedData.rate) ? editedData.rate.flat()[0] : editedData.rate) || 0,            
            total: (Number(editedData.billableHours) * Number(editedData.rate)).toFixed(2),
        };

        console.log("Formatted Items before updating:", updatedItems);
        console.log("Rate values being sent:", updatedItems.map(item => item.rate));

        if (isNewInvoice) {
          setInvoice((prev) => ({ ...prev, items: updatedItems }));
          setEditingRow(null);
          toast.success("Row updated locally!");
          return;
        }
        
        // Existing Invoice → Update in Database
        const response = await axios.put(
            `${process.env.REACT_APP_BACKEND}/invoices/${id}`,
            { items: updatedItems }
        );

        console.log("Update response:", response.data);

        if (response.status === 200) {
            setInvoice((prev) => ({ ...prev, items: updatedItems }));
            setEditingRow(null);
            toast.success("Row updated successfully!");

            // Refresh page after saving
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            console.error("Update failed:", response.status, response.data);
            toast.error("Failed to update row. Please try again.");
        }
    } catch (error) {
        console.error("Error updating invoice:", error);
        toast.error("Error updating invoice. Please check your input and try again.");
    }
};

  const handleChange = (e, field) => {
    setEditedData({ ...editedData, [field]: e.target.value });
  };

  const addNewRow = () => {
    setNewRow({ date: "", actualHours: "", notes: "", billableHours: "", rate: "", total: "" });
    setErrorMessage("");
  };

  const handleNewRowChange = (e, field) => {
    setNewRow({ ...newRow, [field]: e.target.value });
  };

  const handleSaveNewRow = async () => {
    if (!newRow.date || !newRow.billableHours || !newRow.rate) {
        toast.error("Please fill in all required fields: Date, Billable Hours, and Rate.");
        return;
    }

    // Validate Date Format (MM/DD/YYYY)
    const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!datePattern.test(newRow.date)) {
        toast.error("Invalid Date Format. Use MM/DD/YYYY (e.g., 12/15/2024).");
        return;
    }

    // Ensure Billable Hours & Rate are valid numbers
    if (isNaN(newRow.billableHours) || Number(newRow.billableHours) <= 0) {
        toast.error("Billable Hours must be a positive number.");
        return;
    }

    if (isNaN(newRow.rate) || Number(newRow.rate) <= 0) {
        toast.error("Rate must be a positive number.");
        return;
    }

    // Format the new row data properly before saving
    const formattedNewRow = {
        ...newRow,
        date: parseDate(newRow.date.trim(), "MM/DD/YYYY", true), // Convert to ISO format
        actualHours: newRow.actualHours ? newRow.actualHours.trim() : "",
        notes: newRow.notes ? newRow.notes.trim() : "",
        billableHours: Number(newRow.billableHours),
        rate: Number(newRow.rate),
        total: (Number(newRow.billableHours) * Number(newRow.rate)).toFixed(2),
    };

    console.log("Saving new row:", formattedNewRow);

    const updatedItems = [...invoice.items, formattedNewRow];

    try {
      if (isNewInvoice) {
        setInvoice((prev) => ({ ...prev, items: updatedItems }));
        setNewRow(null);
        toast.success("New row added locally!");
        return;
      }
      
      // Existing Invoice → Save to Database
      const response = await axios.put(`${process.env.REACT_APP_BACKEND}/invoices/${id}`, { items: updatedItems });

        if (response.status === 200) {
            console.log("New row added successfully:", response.data);
            setInvoice((prev) => ({ ...prev, items: updatedItems }));
            setNewRow(null);
            setErrorMessage("");
            toast.success("New row added successfully!");
            
            // Refresh page after saving
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    } catch (error) {
        console.error("Error updating invoice:", error);
        toast.error("Failed to update invoice. Please try again.");
    }
  };

  const handleSaveInvoice = async () => {
    try {
        if (!invoice || !invoice.items) {
            console.error("Invoice or items is undefined.");
            toast.error("Invoice data is missing.");
            return;
        }

        // Ensure all fields are extracted from `items`
        const formattedItems = invoice.items.map(item => ({
            ...item,
            date: item.date ? new Date(item.date).toISOString() : "N/A",
            actualHours: item.actualHours || "",
            notes: item.notes || "",
            billableHours: parseFloat(item.billableHours) || 0,
            rate: parseFloat(item.rate) || 0,
            total: parseFloat(item.total) || 0,
        }));

        // Extract values from items
        const dateOfWork = formattedItems.map(item => item.date);
        const actualHoursWorked = formattedItems.map(item => item.actualHours);
        const billableHours = formattedItems.map(item => item.billableHours);
        const rate = formattedItems.map(item => item.rate);
        const totals = formattedItems.map(item => item.total);
        const notes = formattedItems.map(item => item.notes);

        // Recalculate totals
        const newSubtotal = totals.reduce((sum, t) => sum + t, 0);
        const taxAmount = (newSubtotal * (invoice.taxPercentage || 0) / 100).toFixed(2);
        const newTotal = (newSubtotal + parseFloat(taxAmount)).toFixed(2);

        // Ensure `invoiceNumber` is a valid number
        const generatedInvoiceNumber = id ? invoice.invoiceNumber : await fetchInvoiceCount();

        // Prepare payload for saving
        const formattedInvoice = {
            invoiceNumber: generatedInvoiceNumber, // Ensure it's a number
            lpoNumber: invoice.lpoNumber || "",
            user: invoice.user._id || auth.userId, // Ensure user ID is attached
            show: invoice.show,
            venue: invoice.venue,
            dateOfWork,
            actualHoursWorked,
            billableHours,
            rate,
            totals,
            notes,
            subtotal: newSubtotal,
            taxPercentage: invoice.taxPercentage || 0,
            taxAmount,
            total: newTotal,
            items: formattedItems,
            createdAt: invoice.createdAt || new Date().toISOString(),
            eventId: invoice.eventId || eventId, // Attach event ID
        };

        console.log("Saving invoice data:", formattedInvoice);

        let response;
        if (id) {
            // Existing invoice → UPDATE (PUT)
            response = await fetch(`${process.env.REACT_APP_BACKEND}/invoices/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedInvoice),
            });
        } else {
            // New invoice → CREATE (POST)
            response = await fetch(`${process.env.REACT_APP_BACKEND}/invoices`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formattedInvoice),
            });
            
            if (!response.ok) {
                console.error("Error saving invoice:", response.status, response.statusText);
            }
        }

        let responseData;
        try {
            responseData = await response.clone().json(); // Read the response only once
        } catch (err) {
            console.error("Error parsing JSON response:", err);
            toast.error("Error processing server response.");
            return;
        }

        if (response.ok) {
            toast.success("Invoice saved successfully!");

            if (!id) {
              setInvoice(prev => ({ ...prev, _id: responseData.invoice._id }));
          }
          
          // ✅ Redirect to `/user-invoices` after saving
          const redirectPath = auth.role === "admin" ? "/admin/invoices" : "/user/invoices";
          window.location.href = redirectPath;  
        } else {
            console.error("Failed to save invoice:", response.status, response.statusText, responseData);
            toast.error(`Server error: ${responseData.message || "Unable to save invoice."}`);
        }
    } catch (error) {
        console.error("Error saving invoice:", error);
        toast.error("Server error while saving invoice.");
    }
  };

  const fetchInvoiceCount = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND}/invoices/count`);
        const data = await response.json();

        if (!data.count || isNaN(data.count)) {
            throw new Error("Invalid count response from server.");
        }

        return data.count + 1; // Ensure invoiceNumber is numeric
    } catch (error) {
        console.error("Error fetching invoice count:", error);
        return Math.floor(Date.now() / 1000); // Fallback unique number
    }
  };

  const calculateTotals = () => {
    if (!invoice || !invoice.items) return;

    const newSubtotal = invoice.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const newTaxAmount = (newSubtotal * (invoice.taxPercentage / 100)).toFixed(2);
    const newTotal = (newSubtotal + Number(newTaxAmount)).toFixed(2);

    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotal(newTotal);
  };

  useEffect(() => {
    calculateTotals();
  }, [invoice]);

  return (
    <div className="p-4 sm:p-8 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <Link
        to={auth.role === "admin" ? "/admin/invoices" : "/user/invoices"}
        className="mb-4 sm:mb-8 flex items-center text-gray-300 hover:text-white transition-colors"
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
        Return to Invoices
      </Link>

      <div className="relative">
        {/* Download Button */}
        {!isNewInvoice && (
          <button
            onClick={generatePDF}
            className="absolute top-0 right-0 px-4 sm:px-6 py-2 w-auto bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors flex items-center text-sm sm:text-base"
          >
            <FaDownload className="mr-2" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8">Invoice Details</h1>

        {invoice ? (
          <div 
            ref={invoiceRef}
            className="max-w-4xl mx-auto p-4 sm:p-6 rounded-lg shadow bg-neutral-800 text-white"
            style={{
              width: "100%",
              minHeight: "100vh",
              padding: "16px"
          }}
          >
            {/* User and Bill To Section */}
            <div className="flex flex-col sm:flex-row justify-between mb-6 text-white gap-4 sm:gap-0">
              <div className="w-full sm:w-auto">
                <p className="font-bold">Return address:</p>
                <p className="font-bold">{invoice.user.name}</p>
                <p>{invoice.user.address || "N/A"}</p>
                <p>Phone: {invoice.user.phone || "N/A"}</p>
                <p>Email: {invoice.user.email || "N/A"}</p>
              </div>
              <div className="w-full sm:w-2/5">
                <p className="font-bold">Bill to:</p>
                <p className="whitespace-pre-line">{adminData?.address || 'N/A'}</p>
                <p className="whitespace-pre-line">Email: {adminData?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Show: {invoice.show}</h2>

            {/* Editable Venue */}
            <p className="text-sm text-gray-400 mb-2">
                Venue: {isNewInvoice ? (
                    <input 
                        className="bg-transparent border border-gray-500 p-1 text-white w-full"
                        value={invoice.venue}
                        onChange={(e) => setInvoice({ ...invoice, venue: e.target.value })}
                    />
                ) : invoice.venue}
            </p>

            {/* Editable Invoice Number */}
            <p className="text-sm text-gray-400 mb-2">
                Invoice #: {isNewInvoice ? (
                    <input 
                        className="bg-transparent border border-gray-500 p-1 text-white w-full"
                        value={invoice.invoiceNumber}
                        onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                    />
                ) : invoice.invoiceNumber}
            </p>

            {/* Editable LPO Number */}
            <p className="text-sm text-gray-400 mb-2">
                Show #: {isNewInvoice ? (
                    <input 
                        className="bg-transparent border border-gray-500 p-1 text-white w-full"
                        value={invoice.lpoNumber}
                        onChange={(e) => setInvoice({ ...invoice, lpoNumber: e.target.value })}
                    />
                ) : invoice.lpoNumber || "N/A"}
            </p>

            {/* Editable Invoice Date */}
            <p className="text-sm text-gray-400 mb-6">
                Invoice Date: {isNewInvoice ? (
                    <input 
                        type="date"
                        className="bg-transparent border border-gray-500 p-1 text-white w-full"
                        value={invoice.createdAt ? new Date(invoice.createdAt).toISOString().split('T')[0] : ""}
                        onChange={(e) => setInvoice({ ...invoice, createdAt: new Date(e.target.value) })}
                    />
                ) : new Date(invoice.createdAt).toLocaleDateString()}
            </p>

            {/* Invoice Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-700">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-2 border border-gray-700 text-white text-sm sm:text-base w-24 sm:w-44">Date</th>
                    <th className="p-2 border border-gray-700 text-white text-sm sm:text-base w-32 sm:w-64">Hours</th>
                    <th className="p-2 border border-gray-700 text-white text-sm sm:text-base w-32 sm:w-64">Notes</th>
                    <th className="p-2 border border-gray-700 text-white text-sm sm:text-base w-20 sm:w-24">Billable</th>
                    <th className="p-2 border border-gray-700 text-white text-sm sm:text-base w-16 sm:w-20">Rate</th>
                    <th className="p-2 border border-gray-700 text-white text-sm sm:text-base w-24 sm:w-32">Total</th>
                    <th className="p-2 border border-gray-700 text-white text-sm sm:text-base w-20 sm:w-28 text-center">Actions</th>
                  </tr>
                </thead>
                
                <tbody>
                  {invoice?.items?.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={index}>
                        {editingRow === index ? (
                          <>
                            <td>
                              <input
                                className="bg-transparent border border-gray-500 p-1 text-white w-full text-sm sm:text-base"
                                value={editedData.date ?? ""}
                                onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                                placeholder="MM/DD/YYYY"
                              />
                            </td>
                            <td><input className="bg-transparent border border-gray-500 p-1 text-white w-full text-sm sm:text-base" value={editedData.actualHours || ''} onChange={(e) => handleChange(e, 'actualHours')} placeholder="HH:MM - HH:MM" /></td>
                            <td><input className="bg-transparent border border-gray-500 p-1 pl-2 text-white w-full text-sm sm:text-base" value={editedData.notes ?? '-'} onChange={(e) => handleChange(e, 'notes')} /></td>
                            <td><input className="bg-transparent border border-gray-500 p-1 text-white w-full text-sm sm:text-base" value={editedData.billableHours ?? '0'} onChange={(e) => handleChange(e, 'billableHours')} /></td>
                            <td>$ <input className="bg-transparent border border-gray-500 p-1 text-white w-3/4 text-sm sm:text-base" value={editedData.rate || ''} onChange={(e) => handleChange(e, 'rate')} /></td>
                            <td className="text-center w-24 sm:w-32 text-sm sm:text-base">${(editedData.billableHours * editedData.rate).toFixed(2)}</td>
                            <td className="w-20 sm:w-28 border border-gray-700 text-center flex justify-center gap-1 sm:gap-2">
                              <button onClick={() => handleSave(index)} className="bg-gray-600 hover:bg-gray-500 p-1 sm:p-2 rounded text-white w-auto mt-0">
                                <FaSave className="text-sm sm:text-base" />
                              </button>
                              <button onClick={() => setEditingRow(null)} className="bg-gray-600 hover:bg-gray-500 p-1 sm:p-2 rounded text-white w-auto mt-0">
                                <FaTimes className="text-sm sm:text-base" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="w-24 sm:w-44 text-sm sm:text-base">{parseDate(invoice.dateOfWork[index] || "")}</td>
                            <td className="w-32 sm:w-40 text-sm sm:text-base">{item.actualHours}</td>
                            <td className="w-32 sm:w-64 pl-2 sm:pl-4 text-sm sm:text-base">{item.notes && item.notes.trim() ? item.notes : "-"}</td>
                            <td className="w-20 sm:w-24 text-sm sm:text-base">{item.billableHours && item.billableHours > 0 ? item.billableHours : "0"}</td>
                            <td className="w-16 sm:w-32 text-sm sm:text-base">${Number(item.rate).toFixed(2)}</td>
                            <td className="text-center w-24 sm:w-32 whitespace-nowrap text-sm sm:text-base">${Number(item.total).toFixed(2)}</td>
                            <td className="w-20 sm:w-28 border-none text-center flex justify-center gap-1 sm:gap-2">
                              <button 
                                onClick={() => handleEdit(index)} 
                                className="bg-gray-600 hover:bg-gray-500 p-1 sm:p-2 py-1 rounded text-white w-auto mt-0"
                              >
                                <FaEdit className="text-sm sm:text-base" />
                              </button>

                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(index);
                                }} 
                                className="bg-gray-600 hover:bg-gray-500 p-1 sm:p-2 py-1 rounded text-white w-auto mt-0"
                              >
                                <FaTrashAlt className="text-red-500 text-sm sm:text-base" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-gray-400 text-sm sm:text-base">No invoice items available</td>
                    </tr>
                  )}

                  {/* New Row Input Fields */}
                  {newRow && (
                    <tr className="">
                      <td><input className="bg-transparent border border-gray-500 p-1 text-white w-full text-sm sm:text-base" value={newRow.date} onChange={(e) => handleNewRowChange(e, 'date')} placeholder="MM/DD/YYYY" /></td>
                      <td><input className="bg-transparent border border-gray-500 p-1 text-white w-full text-sm sm:text-base" value={newRow.actualHours} onChange={(e) => handleNewRowChange(e, 'actualHours')} placeholder="HH:MM - HH:MM" /></td>
                      <td><input className="bg-transparent border border-gray-500 p-1 text-white w-full text-sm sm:text-base" value={newRow.notes} onChange={(e) => handleNewRowChange(e, 'notes')} /></td>
                      <td><input className="bg-transparent border border-gray-500 p-1 text-white w-full text-sm sm:text-base" value={newRow.billableHours} onChange={(e) => handleNewRowChange(e, 'billableHours')} /></td>
                      <td>$ <input className="bg-transparent border border-gray-500 p-1 text-white w-3/4 text-sm sm:text-base" value={newRow.rate} onChange={(e) => handleNewRowChange(e, 'rate')} /></td>
                      <td className="text-center w-24 sm:w-32 text-sm sm:text-base">${(newRow.billableHours * newRow.rate).toFixed(2)}</td>
                      <td className="text-center flex justify-center gap-1 sm:gap-2">
                        <button onClick={handleSaveNewRow} className="bg-gray-600 hover:bg-gray-500 p-1 sm:p-2 rounded text-white w-auto mt-0">
                          <FaSave className="text-sm sm:text-base" />
                        </button>
                        <button onClick={() => setNewRow(null)} className="bg-gray-600 hover:bg-gray-500 p-1 sm:p-2 rounded text-white w-auto mt-0">
                          <FaTimes className="text-sm sm:text-base" />
                        </button>
                      </td>
                    </tr>
                  )}
                  {errorMessage && <tr><td colSpan="7" className="text-red-500 text-center text-sm sm:text-base">{errorMessage}</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-4">
                <button onClick={addNewRow} className="px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center w-auto mt-2 text-sm sm:text-base">
                    <FaPlus className="mr-2" /> Add Row
                </button>
            </div>

            {/* Invoice Totals */}
            <div className="mt-6 text-white">
              <p className="mb-2 text-sm sm:text-base">
                <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
              </p>
              <p className="mb-2 text-sm sm:text-base">
                <strong>Tax Percentage:</strong> {invoice.taxPercentage}%
              </p>
              <p className="mb-2 text-sm sm:text-base">
                <strong>Tax Amount:</strong> ${taxAmount}
              </p>
              <p className="text-lg sm:text-xl font-bold">
                <strong>Total:</strong> ${total}
              </p>
            </div>

            {/* Action Buttons Section */}
            {isNewInvoice && (
              <div className="flex justify-center items-center mt-6">
                  <button
                      onClick={handleSaveInvoice}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors text-sm sm:text-base"
                  >
                      Save Invoice
                  </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white text-center text-sm sm:text-base">Loading invoice details...</p>
        )}
      </div>
      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <Modal>
            <div className="bg-neutral-900 p-4 sm:p-8 rounded-md shadow-lg w-full max-w-md border border-neutral-700">
                <h2 className="text-red-500 text-xl sm:text-2xl mb-4">
                    Are you sure you want to delete this row?
                </h2>
                <p className="text-neutral-300 mb-6 text-sm sm:text-base">
                    This action cannot be undone. Once deleted, this row's data will be permanently removed.
                </p>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={() => setShowDeletePopup(false)} 
                        className="px-3 sm:px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors text-sm sm:text-base"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete} 
                        className="px-3 sm:px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-full transition-colors text-sm sm:text-base"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </div>

    
    
  );
};

export default Invoice;

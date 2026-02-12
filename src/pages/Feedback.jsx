import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const ITEMS_PER_PAGE = 10;

const AdminFeedback = () => {
  const [pendingFeedbacks, setPendingFeedbacks] = useState([]);
  const [approvedFeedbacks, setApprovedFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);

  const token = localStorage.getItem("token");

  // Fetch pending feedback
  const fetchPending = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/rating-feedback/list?status=false`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPendingFeedbacks(res.data.result || []);
    } catch (err) {
      console.error("Error fetching pending feedback:", err);
    }
  };

  // Fetch approved feedback
  const fetchApproved = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/rating-feedback/list?status=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApprovedFeedbacks(res.data.result || []);
    } catch (err) {
      console.error("Error fetching approved feedback:", err);
    }
  };

  // Fetch both lists
  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPending(), fetchApproved()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Adjust pagination when list size changes
  useEffect(() => {
    const pendingTotalPages = Math.max(
      1,
      Math.ceil(pendingFeedbacks.length / ITEMS_PER_PAGE)
    );
    if (pendingPage > pendingTotalPages) {
      setPendingPage(pendingTotalPages);
    }
  }, [pendingFeedbacks, pendingPage]);

  useEffect(() => {
    const approvedTotalPages = Math.max(
      1,
      Math.ceil(approvedFeedbacks.length / ITEMS_PER_PAGE)
    );
    if (approvedPage > approvedTotalPages) {
      setApprovedPage(approvedTotalPages);
    }
  }, [approvedFeedbacks, approvedPage]);

  // Approve or Reject
  const handleStatusChange = async (id, newStatus) => {
    try {
      const formData = new URLSearchParams();
      formData.append("status", newStatus);

      await axios.put(`${API_BASE_URL}/rating-feedback/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (newStatus) {
        const item = pendingFeedbacks.find((f) => f.id === id);
        setPendingFeedbacks((prev) => prev.filter((f) => f.id !== id));
        if (item)
          setApprovedFeedbacks((prev) => [...prev, { ...item, status: true }]);
      } else {
        const item = approvedFeedbacks.find((f) => f.id === id);
        setApprovedFeedbacks((prev) => prev.filter((f) => f.id !== id));
        if (item)
          setPendingFeedbacks((prev) => [...prev, { ...item, status: false }]);
      }
    } catch (error) {
      console.error("Error updating feedback status:", error);
    }
  };

  const renderTable = (data, page, setPage) => {
    const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const currentItems = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (!currentItems.length) {
      return (
        <tr className="border-b">
          <td colSpan="5" className="text-center py-8 text-gray-500 italic">
            No feedbacks found
          </td>
        </tr>
      );
    }

    return (
      <>
        {currentItems.map((feedback) => (
          <tr
            key={feedback.id}
            className="border-b border-gray-200 transition-colors duration-150 hover:bg-gray-50"
          >
            <td className="p-4 text-sm text-gray-700">
              {feedback?.account?.userDetail?.name || "N/A"}
            </td>
            <td className="p-4 text-sm text-gray-700">{feedback.desc}</td>
            <td className="p-4 text-sm text-gray-700">{feedback.rating}</td>
            <td className="p-4 text-sm font-medium">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  feedback.status
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {feedback.status ? "Approved" : "Pending"}
              </span>
            </td>
            <td className="p-4">
              <div className="flex gap-2">
                {feedback.status ? (
                  <button
                    onClick={() => handleStatusChange(feedback.id, false)}
                    className="px-4 py-2 text-sm rounded-lg font-medium text-red-600 bg-red-100 hover:bg-red-200 transition-colors duration-150"
                  >
                    Reject
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(feedback.id, true)}
                    className="px-4 py-2 text-sm rounded-lg font-medium text-green-600 bg-green-100 hover:bg-green-200 transition-colors duration-150"
                  >
                    Approve
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}

        {/* Pagination controls */}
        <tr>
          <td colSpan="5" className="text-center py-4">
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-150"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-150"
              >
                Next
              </button>
            </div>
          </td>
        </tr>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Feedback Management
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Pending ({pendingFeedbacks.length})
            </button>
            <button
              className={`py-3 px-6 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${
                activeTab === "approved"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("approved")}
            >
              Approved ({approvedFeedbacks.length})
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="p-4">User</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : activeTab === "pending" ? (
                  renderTable(pendingFeedbacks, pendingPage, setPendingPage)
                ) : (
                  renderTable(approvedFeedbacks, approvedPage, setApprovedPage)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeedback;

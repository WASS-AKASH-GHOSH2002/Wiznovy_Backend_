import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaEdit, FaTimes, FaSpinner, FaChevronLeft, FaChevronRight, FaCheck, FaBan } from 'react-icons/fa';


import { API_BASE_URL } from "../config/api";

export default function FaqManager() {
  const [faqs, setFaqs] = useState([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING"); // Default to PENDING to show new requests
  const [showModal, setShowModal] = useState(false);
  const [editFaq, setEditFaq] = useState(null);
  const [formData, setFormData] = useState({ question: "", answer: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const statusOptions = [
    { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
    { value: "DEACTIVE", label: "Inactive", color: "bg-gray-100 text-gray-800" },
    { value: "DELETED", label: "Deleted", color: "bg-red-100 text-red-800" },
    { value: "SUSPENDED", label: "Suspended", color: "bg-yellow-100 text-yellow-800" },
    { value: "PENDING", label: "Pending", color: "bg-blue-100 text-blue-800" },
  ];

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const res = await axios.get(`${API_BASE_URL}/faqs/list`, {
        params: { keyword, status: statusFilter, limit, offset },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setFaqs(res.data.result);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchFaqs();
  }, [keyword, statusFilter]);

  useEffect(() => {
    fetchFaqs();
  }, [currentPage]);

  const handleSubmit = async () => {
    setSubmissionError("");
    setSaving(true);
    try {
      if (editFaq) {
        await axios.patch(`${API_BASE_URL}/faqs/${editFaq.id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/faqs`, { ...formData, status: "PENDING" }, { // New FAQs start as PENDING
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      setShowModal(false);
      setFormData({ question: "", answer: "" });
      setEditFaq(null);
      setCurrentPage(1);
      fetchFaqs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      if (error.response && error.response.status === 409) {
        setSubmissionError("An FAQ with this question already exists. Please use a different question.");
      } else {
        setSubmissionError("Failed to save the FAQ. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/faqs/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchFaqs();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const resetForm = () => {
    setFormData({ question: "", answer: "" });
    setEditFaq(null);
    setShowModal(false);
    setSubmissionError("");
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-100 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight mb-4 sm:mb-0">
            FAQ Manager
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-md text-gray-600 font-medium">
              Total FAQs: <span className="font-semibold text-blue-600">{total}</span>
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center"
            >
              <FaPlus className="h-4 w-4 mr-2" /> Add FAQ
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by question or answer..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="block w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full md:w-48 pl-4 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-hidden shadow-lg ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Answer
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
                      <span className="ml-3 text-lg text-gray-600">Loading FAQs...</span>
                    </div>
                  </td>
                </tr>
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No FAQs found.
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-5 whitespace-normal max-w-xs sm:max-w-sm">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">{faq.question}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-normal max-w-xs sm:max-w-md hidden sm:table-cell">
                      <div className="text-sm text-gray-500 line-clamp-2">{faq.answer}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                          statusOptions.find(o => o.value === faq.status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                        {statusOptions.find(o => o.value === faq.status)?.label || faq.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {faq.status === "PENDING" ? (
                          <>
                            <button
                              onClick={() => changeStatus(faq.id, "ACTIVE")}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Accept"
                            >
                              <FaCheck className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => changeStatus(faq.id, "SUSPENDED")}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Reject"
                            >
                              <FaBan className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditFaq(faq);
                              setFormData({ question: faq.question, answer: faq.answer });
                              setShowModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-800 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="h-5 w-5" />
                          </button>
                        )}
                        <div className="relative">
                          <select
                            value={faq.status}
                            onChange={(e) => changeStatus(faq.id, e.target.value)}
                            className="block w-full pl-3 pr-10 py-1 text-sm border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft className="h-4 w-4 mr-2" /> Previous
            </button>
            <span className="text-sm text-gray-700">
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <FaChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform scale-95 transition-transform duration-300 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editFaq ? "Edit FAQ" : "Add FAQ"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              {submissionError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                  <span className="block sm:inline">{submissionError}</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-2">
                    Question
                  </label>
                  <input
                    id="question"
                    type="text"
                    placeholder="Enter question"
                    value={formData.question}
                    onChange={(e) => {
                      setFormData({ ...formData, question: e.target.value });
                      setSubmissionError("");
                    }}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="answer" className="block text-sm font-semibold text-gray-700 mb-2">
                    Answer
                  </label>
                  <textarea
                    id="answer"
                    rows="5"
                    placeholder="Enter answer"
                    value={formData.answer}
                    onChange={(e) => {
                      setFormData({ ...formData, answer: e.target.value });
                      setSubmissionError("");
                    }}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center justify-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                      {editFaq ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editFaq ? "Update FAQ" : "Create FAQ"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
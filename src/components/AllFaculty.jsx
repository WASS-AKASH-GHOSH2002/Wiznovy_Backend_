import React, { useEffect, useState } from "react";
import { api } from "../config/axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const FacultyArea = () => {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [searchTerm, setSearchTerm] = useState("");
  const [passwordErrors, setPasswordErrors] = useState("");
  const navigate = useNavigate(); // Initialize navigate

  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/account/stafflist?status=${statusFilter}&limit=20&offset=0`
      );
      setStaffs(res.data.result);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaffs();
  }, [statusFilter]);

  const toggleStatus = async (id, status) => {
    if (window.confirm(`Are you sure you want to ${status === "ACTIVE" ? "activate" : "deactivate"} this staff member?`)) {
      await api.put(`/account/staff/status/${id}`, { status });
      fetchStaffs();
    }
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      return "Password must contain both uppercase and lowercase letters";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const updatePassword = async (id) => {
    const error = validatePassword(newPassword);
    if (error) {
      setPasswordErrors(error);
      return;
    }
    
    if (!newPassword) return;
    
    await api.patch(`/account/staff/password/${id}`, { password: newPassword });
    setNewPassword("");
    setSelected(null);
    setPasswordErrors("");
    alert("Password updated successfully!");
  };

  // Function to navigate to menu permissions
  const goToMenuPermissions = (accountId) => {
    navigate(`/menu-permission/${accountId}`);
  };

  // Filter staff based on search term
  const filteredStaffs = staffs.filter(staff => 
    staff.staffDetail?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.staffDetail?.[0]?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-lg mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="bg-blue-100 p-2 rounded-lg mr-3">👨‍💼</span>
          Staff Management
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setStatusFilter("ACTIVE")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            statusFilter === "ACTIVE"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Active Staff
        </button>
        <button
          onClick={() => setStatusFilter("DEACTIVE")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            statusFilter === "DEACTIVE"
              ? "bg-red-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Deactivated Staff
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredStaffs.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg">
            No {statusFilter.toLowerCase()} staff found.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm ? "Try a different search term" : "Try changing the status filter"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-700 text-sm">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Login ID</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffs.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    {s.staffDetail?.[0]?.name || "N/A"}
                  </td>
                  <td className="p-4">
                    {s.staffDetail?.[0]?.email || "N/A"}
                  </td>
                  <td className="p-4">{s.phoneNumber}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() =>
                          toggleStatus(
                            s.id,
                            s.status === "ACTIVE" ? "DEACTIVE" : "ACTIVE"
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          s.status === "ACTIVE"
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {s.status === "ACTIVE" ? "DEACTIVE" : "Activate"}
                      </button>
                      <button
                        onClick={() => setSelected(s.id)}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-all"
                      >
                        Change Password
                      </button>
                      {/* New button for menu permissions */}
                      <button
                        onClick={() => goToMenuPermissions(s.id)}
                        className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-all"
                      >
                        Menu Permissions
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="mt-6 p-5 border rounded-xl bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-3 text-blue-800">
            Update Password for Staff ID: {selected}
          </h3>
          <div className="mb-3">
            <input
              type="password"
              placeholder="Enter new password"
              className="border p-2.5 rounded-lg mr-2 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordErrors("");
              }}
            />
            {passwordErrors && (
              <p className="text-red-500 text-sm mt-1">{passwordErrors}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters with uppercase, lowercase, and numbers
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updatePassword(selected)}
              className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all"
              disabled={!newPassword}
            >
              Update Password
            </button>
            <button
              onClick={() => {
                setSelected(null);
                setPasswordErrors("");
              }}
              className="ml-2 text-gray-600 hover:text-gray-800 px-3 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyArea;
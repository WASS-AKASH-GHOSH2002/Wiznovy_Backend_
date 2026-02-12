import React, { useEffect, useState } from "react";
import { api } from "../config/axios";

const FacultyArea = () => {
  const [activeTab, setActiveTab] = useState("manage");
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    name: "",
    email: "",
    dob: "",
    gender: "",
    city: "",
    state: "",
    country: "",
    pin: "",
  });
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [formLoading, setFormLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
    if (activeTab === "manage") {
      fetchStaffs();
    }
  }, [statusFilter, activeTab]);

  const toggleStatus = async (id, status) => {
    await api.put(`/account/staff/status/${id}`, { status });
    fetchStaffs();
  };

  const updatePassword = async (id) => {
    if (!newPassword) return;
    await api.patch(`/account/staff/password/${id}`, { password: newPassword });
    setNewPassword("");
    setSelected(null);
    alert("Password updated successfully!");
  };

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMsg("");

    try {
      await api.post("/account/add-staff", form);
      setMsg("✅ Staff created successfully!");
      setForm({
        loginId: "",
        password: "",
        name: "",
        email: "",
        dob: "",
        gender: "",
        city: "",
        state: "",
        country: "",
        pin: "",
      });
      setShowPassword(false); // Reset password visibility
    } catch (err) {
      setMsg("❌ Error: " + err.response?.data?.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-lg mt-6">
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("manage")}
          className={`py-3 px-6 font-medium text-sm rounded-t-lg mr-1 ${
            activeTab === "manage"
              ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Manage Staff
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
            activeTab === "add"
              ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Add New Staff
        </button>
      </div>

      {/* Manage Staff Tab */}
      {activeTab === "manage" && (
        <div>
          {/* Filter Buttons */}
          <div className="flex gap-4 mb-6">
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
          ) : staffs.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-lg">
                No {statusFilter.toLowerCase()} staff found.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Try changing the filter or add new staff members.
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
                  {staffs.map((s) => (
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
                            {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setSelected(s.id)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-all"
                          >
                            Change Password
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
              <div className="flex items-center">
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="border p-2.5 rounded-lg mr-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  onClick={() => updatePassword(selected)}
                  className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all"
                >
                  Update
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-2 text-gray-600 hover:text-gray-800 px-3 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Staff Tab */}
      {activeTab === "add" && (
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-5 text-gray-700">
            Add New Staff Member
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 mb-1">
                Login ID *
              </label>
              <input
                id="loginId"
                type="text"
                name="loginId"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.loginId}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  value={form.password}
                  onChange={handleFormChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email}
                onChange={handleFormChange}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                name="dob"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.dob}
                onChange={handleFormChange}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.gender}
                onChange={handleFormChange}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                name="city"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.city}
                onChange={handleFormChange}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                id="state"
                type="text"
                name="state"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.state}
                onChange={handleFormChange}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                id="country"
                type="text"
                name="country"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.country}
                onChange={handleFormChange}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                PIN Code
              </label>
              <input
                id="pin"
                type="text"
                name="pin"
                className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.pin}
                onChange={handleFormChange}
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-70"
              >
                {formLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Staff...
                  </span>
                ) : (
                  "Create Staff"
                )}
              </button>
            </div>
          </form>
          {msg && (
            <div
              className={`mt-4 p-3 rounded-lg text-center ${
                msg.includes("✅")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyArea;
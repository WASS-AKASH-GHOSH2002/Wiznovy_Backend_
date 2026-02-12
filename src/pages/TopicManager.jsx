import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { RefreshCw, Settings, Edit } from "lucide-react";
import {
  createTopic,
  getAllTopics,
  updateTopic,
  updateTopicStatus,
  clearError,
} from "../store/topicSlice";

/* =====================
   REUSABLE UI
===================== */

const StatusOptions = () => (
  <>
    <option value="ACTIVE">Active</option>
    <option value="DEACTIVE">Deactive</option>
    <option value="DELETED">Deleted</option>
    <option value="SUSPENDED">Suspended</option>
    <option value="PENDING">Pending</option>
  </>
);

const StatusBadge = ({ status }) => {
  const classes = {
    ACTIVE: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    SUSPENDED: "bg-orange-100 text-orange-800",
    DELETED: "bg-gray-100 text-gray-800",
    DEACTIVE: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${classes[status]}`}>
      {status}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

const Modal = ({ isOpen, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const ActionButton = ({ onClick, title, className, children }) => (
  <button onClick={onClick} title={title} className={className}>
    {children}
  </button>
);

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/* =====================
   MAIN COMPONENT
===================== */

const TopicManager = () => {
  const dispatch = useDispatch();
  const { topics, loading, error } = useSelector((state) => state.topics);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [formData, setFormData] = useState({ name: "", status: "ACTIVE" });

  /* =====================
     EFFECTS
  ===================== */

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = () => {
    dispatch(getAllTopics());
  };

  /* =====================
     FORM HANDLERS
  ===================== */

  const openAddForm = () => {
    setFormData({ name: "", status: "ACTIVE" });
    setSelectedTopic(null);
    setShowFormModal(true);
  };

  const openEditForm = (topic) => {
    setSelectedTopic(topic);
    setFormData({ name: topic.name, status: topic.status });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setSelectedTopic(null);
    setFormData({ name: "", status: "ACTIVE" });
    dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTopic) {
        await dispatch(
          updateTopic({
            topicId: selectedTopic.id,
            topicData: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createTopic(formData)).unwrap();
      }
      closeFormModal();
      fetchTopics();
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================
     STATUS HANDLERS
  ===================== */

  const openStatusModal = (topic) => {
    setSelectedTopic(topic);
    setNewStatus(topic.status);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedTopic(null);
    setNewStatus("");
  };

  const confirmStatusUpdate = async () => {
    try {
      await dispatch(
        updateTopicStatus({
          topicId: selectedTopic.id,
          status: newStatus,
        }),
      ).unwrap();
      closeStatusModal();
      fetchTopics();
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================
     RENDER STATES
  ===================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchTopics}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* =====================
     MAIN UI
  ===================== */

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div
        className={`max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg ${
          showFormModal || showStatusModal ? "blur-sm" : ""
        }`}
      >
        <div className="flex justify-between mb-6">
          <h2 className="text-3xl font-bold">Topic Management</h2>
          <div className="flex gap-2">
            <button
              onClick={openAddForm}
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Add Topic
            </button>
            <button
              onClick={fetchTopics}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        <p className="mb-4 text-gray-600">Total Topics: {topics.length}</p>

        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left hidden sm:table-cell">
                Created At
              </th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic, i) => (
              <tr key={topic.id} className={i % 2 ? "bg-gray-50" : ""}>
                <td className="p-3">{topic.name}</td>
                <td className="p-3">
                  <StatusBadge status={topic.status} />
                </td>
                <td className="p-3 hidden sm:table-cell">
                  {new Date(topic.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 flex gap-1">
                  <ActionButton
                    title="Edit"
                    onClick={() => openEditForm(topic)}
                    className="text-blue-600"
                  >
                    <Edit size={16} />
                  </ActionButton>
                  <ActionButton
                    title="Update Status"
                    onClick={() => openStatusModal(topic)}
                    className="text-green-600"
                  >
                    <Settings size={16} />
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={showFormModal}
        title={selectedTopic ? "Edit Topic" : "Add Topic"}
      >
        <form onSubmit={handleSubmit}>
          <input
            className="w-full border p-2 mb-4 rounded"
            placeholder="Topic Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
          <select
            className="w-full border p-2 mb-4 rounded"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
          >
            <StatusOptions />
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeFormModal}
              className="flex-1 bg-gray-500 text-white p-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white p-2 rounded"
            >
              {selectedTopic ? "Update Topic" : "Add Topic"}
            </button>
          </div>
        </form>
      </Modal>

      {/* STATUS MODAL */}
      <Modal isOpen={showStatusModal} title="Update Topic Status">
        <select
          className="w-full border p-2 mb-4 rounded"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        >
          <StatusOptions />
        </select>
        <div className="flex gap-2">
          <button
            onClick={closeStatusModal}
            className="flex-1 bg-gray-500 text-white p-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={confirmStatusUpdate}
            className="flex-1 bg-blue-500 text-white p-2 rounded"
          >
            Update
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TopicManager;

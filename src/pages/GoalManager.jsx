import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, Settings, Edit, Trash2, Plus } from 'lucide-react';
import {
  createGoal,
  getAllGoals,
  updateGoal,
  updateGoalStatus,
  deleteGoal,
  clearError,
} from '../store/goalSlice';

/* =====================
   REUSABLE COMPONENTS
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
  const statusClasses = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUSPENDED: 'bg-orange-100 text-orange-800',
    DELETED: 'bg-gray-100 text-gray-800',
    DEACTIVE: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
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

const ActionButton = ({ onClick, title, children, className }) => (
  <button onClick={onClick} title={title} className={className}>
    {children}
  </button>
);

/* =====================
   MAIN COMPONENT
===================== */

const GoalManager = () => {
  const dispatch = useDispatch();
  const { goals, loading, error } = useSelector((state) => state.goals);

  const [formData, setFormData] = useState({ name: '', status: 'ACTIVE' });
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  /* =====================
     EFFECTS
  ===================== */
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = () => {
    dispatch(getAllGoals());
  };

  /* =====================
     FORM HANDLERS
  ===================== */

  const resetForm = () => {
    setFormData({ name: '', status: 'ACTIVE' });
    setEditingId(null);
    setShowForm(false);
    dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dispatch(
          updateGoal({ goalId: editingId, goalData: formData }),
        ).unwrap();
      } else {
        await dispatch(createGoal(formData)).unwrap();
      }
      resetForm();
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (goal) => {
    setFormData({ name: goal.name, status: goal.status });
    setEditingId(goal.id);
    setShowForm(true);
  };

  /* =====================
     STATUS HANDLERS
  ===================== */

  const openStatusModal = (goal) => {
    setSelectedGoal(goal);
    setNewStatus(goal.status);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setSelectedGoal(null);
    setNewStatus('');
    setShowStatusModal(false);
  };

  const confirmStatusUpdate = async () => {
    try {
      await dispatch(
        updateGoalStatus({
          goalId: selectedGoal.id,
          status: newStatus,
        }),
      ).unwrap();
      closeStatusModal();
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================
     DELETE HANDLERS
  ===================== */

  const openDeleteModal = (goal) => {
    setSelectedGoal(goal);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setSelectedGoal(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteGoal(selectedGoal.id)).unwrap();
      closeDeleteModal();
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================
     RENDER
  ===================== */

  if (loading && goals.length === 0) {
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
          <p className="text-red-500 mb-4">
            {error?.message || 'Something went wrong'}
          </p>
          <button
            onClick={fetchGoals}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div
        className={`max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg ${
          showForm || showStatusModal || showDeleteModal ? 'blur-sm' : ''
        }`}
      >
        <div className="flex justify-between mb-6">
          <h2 className="text-3xl font-bold">Goal Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex gap-2"
            >
              <Plus size={18} /> Add Goal
            </button>
            <button
              onClick={fetchGoals}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        <p className="mb-4 text-gray-600">Total Goals: {goals.length}</p>

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
            {goals.map((goal, i) => (
              <tr key={goal.id} className={i % 2 ? 'bg-gray-50' : ''}>
                <td className="p-3">{goal.name}</td>
                <td className="p-3">
                  <StatusBadge status={goal.status} />
                </td>
                <td className="p-3 hidden sm:table-cell">
                  {new Date(goal.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 flex gap-1">
                  <ActionButton
                    onClick={() => handleEdit(goal)}
                    title="Edit"
                    className="text-blue-600"
                  >
                    <Edit size={16} />
                  </ActionButton>
                  <ActionButton
                    onClick={() => openStatusModal(goal)}
                    title="Update Status"
                    className="text-green-600"
                  >
                    <Settings size={16} />
                  </ActionButton>
                  <ActionButton
                    onClick={() => openDeleteModal(goal)}
                    title="Delete"
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal isOpen={showForm} title={editingId ? 'Edit Goal' : 'Add Goal'}>
        <form onSubmit={handleSubmit}>
          <input
            className="w-full border p-2 mb-4 rounded"
            placeholder="Goal Name"
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
              onClick={resetForm}
              className="flex-1 bg-gray-500 text-white p-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white p-2 rounded"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* STATUS MODAL */}
      <Modal isOpen={showStatusModal} title="Update Status">
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

      {/* DELETE MODAL */}
      <Modal isOpen={showDeleteModal} title="Delete Goal">
        <p className="mb-4 text-gray-600">
          Are you sure you want to delete this goal?
        </p>
        <div className="flex gap-2">
          <button
            onClick={closeDeleteModal}
            className="flex-1 bg-gray-500 text-white p-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 bg-red-500 text-white p-2 rounded"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default GoalManager;

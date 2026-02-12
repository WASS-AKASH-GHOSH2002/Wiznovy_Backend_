import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Set up axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const CouponAdminPanel = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, DEACTIVE

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    type: 'FIXED',
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    validFrom: '',
    validUntil: '',
    usageLimit: 1,
    userUsageLimit: 1,
    isFirstOrderOnly: false,
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    filterCoupons();
  }, [coupons, statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/coupons');
      setCoupons(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch coupons');
      setLoading(false);
    }
  };

  const filterCoupons = () => {
    if (statusFilter === 'ALL') {
      setFilteredCoupons(coupons);
    } else {
      const filtered = coupons.filter(coupon => coupon.status === statusFilter);
      setFilteredCoupons(filtered);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/coupons', formData);
      setSuccess('Coupon created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/coupons/${currentCoupon.id}`, formData);
      setSuccess('Coupon updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update coupon');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await axios.delete(`/coupons/${id}`);
        setSuccess('Coupon deleted successfully');
        fetchCoupons();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      type: 'FIXED',
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      validFrom: '',
      validUntil: '',
      usageLimit: 1,
      userUsageLimit: 1,
      isFirstOrderOnly: false,
      status: 'ACTIVE'
    });
  };

  const openEditModal = (coupon) => {
    setCurrentCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil.split('T')[0],
      usageLimit: coupon.usageLimit,
      userUsageLimit: coupon.userUsageLimit,
      isFirstOrderOnly: coupon.isFirstOrderOnly,
      status: coupon.status
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    // 
    <h1>Coupon Management Coming Soon</h1>
  );
};

export default CouponAdminPanel;
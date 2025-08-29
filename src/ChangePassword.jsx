import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Paper, Alert } from '@mui/material';
import { baseUrl } from '../baseUrl';

const ChangePassword = ({ user }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword.trim()) newErrors.currentPassword = 'Current password is required';
    if (!formData.newPassword) newErrors.newPassword = 'New password is required';
    if (formData.newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters';
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setSuccessMessage('');
    setErrorMessage('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await fetch(`${baseUrl}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
           user_id:user.user.id,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      // Clear form on success
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Password changed successfully!');
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while changing your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          <strong>User:</strong> {user.user?.name || 'Unknown'}
        </Typography>
      </Box>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Current Password"
          type="password"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          margin="normal"
          error={!!errors.currentPassword}
          helperText={errors.currentPassword}
          required
        />
        
        <TextField
          fullWidth
          label="New Password"
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          margin="normal"
          error={!!errors.newPassword}
          helperText={errors.newPassword}
          required
        />
        
        <TextField
          fullWidth
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          margin="normal"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          required
        />
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </form>
    </Paper>
  );
};

export default ChangePassword;
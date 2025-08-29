import React from 'react';
import { Typography, Box, Paper, Divider } from '@mui/material';
import ChangePassword from './ChangePassword'

const UserProfile = ({ user }) => {
  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">User data not available</Typography>
        <Typography variant="body2">Please log in again.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          User Profile
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Name:</strong> {user.user.name}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user.user.email}
          </Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
            <strong>Role:</strong> {user.user.role || 'User'}
          </Typography>
        </Box>
      </Paper>
      
      <Divider sx={{ my: 3 }} />
      
      <ChangePassword user={user} />
    </Box>
  );
};

export default UserProfile;
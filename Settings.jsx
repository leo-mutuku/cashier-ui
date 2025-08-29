import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Typography } from '@mui/material';
import UserProfile from './UserProfile';

const Settings = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data', error);
      }
    }
  }, []);

  return (
    <Container fluid>
      <Row>
        <Col>
          <Typography variant="h5" component="h2" gutterBottom>
            Account Settings
          </Typography>
          
          <UserProfile user={currentUser} />
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
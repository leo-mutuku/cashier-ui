import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, Outlet, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HashRouter as Router } from 'react-router-dom';

// Material UI Components
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import UploadIcon from '@mui/icons-material/Upload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

// Import your page components
import CsvUploadComponent from './CsvUploadComponent';
import CashierDashboard from './CashierDashboard';
import ReceiptHistory from './ReceiptHistory';
import Settings from './Settings';
import UserProfile from './UserProfile';
import { baseUrl } from '../baseUrl';
import { MenuBookOutlined } from '@mui/icons-material';

// Function to handle API calls
const api = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username:email, password }),
      });
      
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        if (isJson) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          } catch (parseError) {
            // If JSON parsing fails, use status text or generic message
            throw new Error(response.statusText || 'Login failed with status: ' + response.status);
          }
        } else {
          // Not JSON response
          const errorText = await response.text();
          throw new Error(errorText || response.statusText || 'Login failed');
        }
      }
      
      if (!isJson) {
        throw new Error('Invalid response format from server');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  signup: async (userData) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`${baseUrl}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        if (isJson) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Signup failed');
          } catch (parseError) {
            // If JSON parsing fails, use status text or generic message
            throw new Error(response.statusText || 'Signup failed with status: ' + response.status);
          }
        } else {
          // Not JSON response
          const errorText = await response.text();
          throw new Error(errorText || response.statusText || 'Signup failed');
        }
      }
      
      if (!isJson) {
        throw new Error('Invalid response format from server');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
};

// Login Component
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
   
      // Actual API call
      const userData = await api.login(email, password);
      onLogin(userData);
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </Typography>
    </Box>
  );
}

// Signup Component
function Signup({ onSignup }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

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
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setGeneralError('');
    
    try {
      // Actual API call
      const userData = await api.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      onSignup(userData);
    } catch (err) {
      setGeneralError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>Sign Up</Typography>
      {generalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {generalError}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          error={!!errors.name}
          helperText={errors.name}
          required
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          error={!!errors.email}
          helperText={errors.email}
          required
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          error={!!errors.password}
          helperText={errors.password}
          required
        />
        <TextField
          fullWidth
          label="Confirm Password"
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
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </Typography>
    </Box>
  );
}

// Layout Component with logout functionality
function Layout({ user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseMenuItems = [
      { text: 'Upload Receipts', icon: <UploadIcon />, path: '/' },
      { text: 'Cashier Dashboard', icon: <MenuBookOutlined/>, path: '/cashier-dashboard' },
      { text: 'Receipt History', icon: <ReceiptIcon />, path: '/receipt-history' },
     
    ];
    
    // Add role-specific menu items
    if (user && user.role === 'admin') {
      baseMenuItems.push(
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
      );
    }
    
    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.text : 'Sales Receipts Uploader';
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="bg-primary text-white py-2 shadow-sm">
        <Container fluid>
          <Row className="align-items-center">
            <Col xs={2}>
              <IconButton 
                edge="start" 
                color="inherit" 
                aria-label="menu"
                onClick={toggleDrawer(true)}
                className="p-0"
              >
                <MenuIcon style={{ color: 'white' }} />
              </IconButton>
            </Col>
            <Col xs={8} className="text-center">
              <h1 className="h4 mb-0 fw-normal">{getCurrentPageTitle()}</h1>
              <p className="small mb-0 opacity-75">Upload and manage your sales receipts</p>
            </Col>
            <Col xs={2} className="text-end">
              <IconButton
                color="inherit"
                aria-label="logout"
                onClick={handleLogout}
                className="p-0"
              >
                <LogoutIcon style={{ color: 'white' }} />
              </IconButton>
            </Col>
          </Row>
        </Container>
      </header>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box sx={{ width: 250 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="subtitle1">{user?.user?.name || 'User'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.user?.email}
            </Typography>
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
              Role: {user?.user?.role || 'User'}
            </Typography>
          </Box>
          
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.text} 
                component={Link} 
                to={item.path}
                selected={location.pathname === item.path}
                onClick={toggleDrawer(false)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{ borderTop: '1px solid #eee', mt: 2 }}
            >
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <main className="flex-grow-1 py-2">
        <Container fluid className="py-3">
          <Row>
            <Col className="px-4">
              <div className="bg-white rounded shadow-sm p-4">
                <Outlet />
              </div>
            </Col>
          </Row>
        </Container>
      </main>

      <footer className="bg-dark text-white py-3 mt-auto">
        <Container fluid>
          <Row>
            <Col>
              <p className="small text-center mb-0 opacity-75">
                © 2025 Cahier UI. All rights reserved Mogulafric.
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}

// Main App Component with localStorage integration
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });

  // Check for user in localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data from localStorage', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    showNotification(`Welcome, ${userData.name || userData.email}!`, 'success');
  };

  const handleSignup = (userData) => {
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    showNotification('Account created successfully!', 'success');
  };

  const handleLogout = () => {
    // Remove from localStorage
    localStorage.removeItem('user');
    setUser(null);
    showNotification('You have been logged out successfully', 'info');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ open: true, message, type });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup onSignup={handleSignup} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          {/* <Route index element={<CsvUploadComponent />} /> */}
          <Route index element={<CashierDashboard />} />
          <Route path="cashier-dashboard" element={<CashierDashboard />} />
          <Route path="receipt-history" element={<ReceiptHistory />} />
          {/* <Route path="profile" element={<UserProfile user={user} />} /> */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.type} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Router>
  );
}

export default App;
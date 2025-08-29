import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form, InputGroup, Pagination } from 'react-bootstrap';
import { Search, Calendar } from 'lucide-react';
import { baseUrl } from '../baseUrl';
import axios from 'axios';

function ReceiptHistory() {
  // Get current date in YYYY-MM-DD format - moved up to fix reference error
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // State for user, receipts, and loading
  const [user, setUser] = useState(null); // Initialize as null for clarity
  const [userLoading, setUserLoading] = useState(true); // Track user loading state
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for date filters and pagination
  const [startDate, setStartDate] = useState(getCurrentDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch user from localStorage
  useEffect(() => {
    const fetchUser = () => {
      try {
        setUserLoading(true);
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          setUser(null); // Explicitly set to null if no user data
        }
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
        setUser(null); // Handle parse error
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Add custom CSS for pagination styling
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .pagination-custom .page-item .page-link {
        border-radius: 4px;
        margin: 0 2px;
        color: #495057;
        background-color: #fff;
        border: 1px solid #dee2e6;
        padding: 0.375rem 0.75rem;
      }
      
      .pagination-custom .page-item.active .page-link {
        background-color: #0d6efd;
        border-color: #0d6efd;
        color: white;
        font-weight: 500;
      }
      
      .pagination-custom .page-item .page-link:hover:not(.active) {
        background-color: #e9ecef;
        border-color: #dee2e6;
      }
      
      .pagination-custom .page-item.disabled .page-link {
        color: #6c757d;
        pointer-events: none;
        background-color: #fff;
        border-color: #dee2e6;
      }
      
      @media (max-width: 768px) {
        .pagination-custom .page-link {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch receipts from API
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${baseUrl}/api/v1/salesorder/getsalesorders`, {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setReceipts(response.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [startDate, endDate]);

  // Calculate statistics dynamically
  const stats = receipts.reduce(
    (acc, receipt) => {
      const amount = parseFloat(receipt.amount);
      const isCleared = receipt.status === 'Processed';
      return {
        totalReceipts: acc.totalReceipts + 1,
        totalAmount: acc.totalAmount + amount,
        clearedReceipts: acc.clearedReceipts + (isCleared ? 1 : 0),
        clearedAmount: acc.clearedAmount + (isCleared ? amount : 0),
        unclearedReceipts: acc.unclearedReceipts + (isCleared ? 0 : 1),
        unclearedAmount: acc.unclearedAmount + (isCleared ? 0 : amount),
        averageReceiptValue: (acc.totalAmount + amount) / (acc.totalReceipts + 1),
      };
    },
    {
      totalReceipts: 0,
      totalAmount: 0,
      clearedReceipts: 0,
      clearedAmount: 0,
      unclearedReceipts: 0,
      unclearedAmount: 0,
      averageReceiptValue: 0,
    }
  );

  // Filter receipts based on search term
  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.receipt_number.includes(searchTerm) ||
      receipt.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle filter application
  const applyFilter = () => {
    setCurrentPage(1);
    // No need to duplicate the API call logic since it already happens in the useEffect
    // The useEffect will trigger when startDate or endDate changes
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Generate pagination items
  const paginationItems = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(5, totalPages);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 4);
    }
  }

  if (startPage > 1) {
    paginationItems.push(
      <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
        1
      </Pagination.Item>
    );
    if (startPage > 2) {
      paginationItems.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
  }

  for (let number = startPage; number <= endPage; number++) {
    paginationItems.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationItems.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    paginationItems.push(
      <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
        {totalPages}
      </Pagination.Item>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  // Render loading state while fetching user
  if (userLoading) {
    return (
      <div className="p-3 text-center">
        <h4>Loading user data...</h4>
      </div>
    );
  }

  // Render error or redirect if user is not authenticated
  if (!user) {
    return (
      <div className="p-3 text-center">
        <h4>Please log in to view receipt history.</h4>
        {/* Optionally, redirect to login page */}
        {/* <Button as={Link} to="/login">Go to Login</Button> */}
      </div>
    );
  }

  return (
    <div className="p-3">
      <h4 className="mb-3">Receipt History</h4>

      {/* Date Filter Controls */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <Calendar size={16} className="me-2" />
                  Start Date
                </Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <Calendar size={16} className="me-2" />
                  End Date
                </Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button variant="primary" className="w-100" onClick={applyFilter}>
                Apply Filter
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="text-muted small">Total Receipts</div>
              <div className="fs-4 fw-bold">{stats.totalReceipts}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100 shadow-sm">
            {user?.user?.role === 'admin' && (
              <Card.Body className="p-3">
                <div className="text-muted small">Total Amount</div>
                <div className="fs-4 fw-bold">shs {stats.totalAmount.toLocaleString()}</div>
                <div className="text-success small mt-1">
                  Avg. shs {stats.averageReceiptValue.toFixed(2)}/receipt
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="text-muted small">Cleared</div>
              <div className="fs-4 fw-bold">{stats.clearedReceipts}</div>
              <div className="text-success small mt-1">
                shs {stats.clearedAmount.toLocaleString()}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="text-muted small">Uncleared</div>
              <div className="fs-4 fw-bold">{stats.unclearedReceipts}</div>
              <div className="text-warning small mt-1">
                shs {stats.unclearedAmount.toLocaleString()}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Receipts Table */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="d-flex align-items-center">
              <h6 className="mb-0 me-2">Receipt List</h6>
              {loading && (
                <span className="badge bg-secondary text-white">Loading...</span>
              )}
            </div>
            <InputGroup size="sm" className="w-100 w-md-auto" style={{ maxWidth: '300px' }}>
              <InputGroup.Text className="bg-white">
                <Search size={14} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by receipt # or customer..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search"
                size="sm"
                className="border-start-0"
              />
            </InputGroup>
          </div>
        </Card.Header>
        <div className="table-responsive">
          <Table hover className="mb-0" responsive>
            <thead className="table-light">
              <tr>
                <th className="fw-semibold">Receipt #</th>
                <th className="fw-semibold">Date</th>
                <th className="fw-semibold">Customer</th>
                <th className="fw-semibold">Amount</th>
                <th className="fw-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="text-center py-3 text-danger">
                    Error: {error}
                  </td>
                </tr>
              ) : currentReceipts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    No receipts found
                  </td>
                </tr>
              ) : (
                currentReceipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="fw-medium">#{receipt.receipt_number}</td>
                    <td>{formatDate(receipt.date)}</td>
                    <td>{receipt.customer_name}</td>
                    <td className="fw-medium">shs {parseFloat(receipt.amount).toFixed(2)}</td>
                    <td>
                      <Badge
                        bg={receipt.status === 'Processed' ? 'success' : 'warning'}
                        className="text-capitalize px-3 py-2 rounded-pill"
                        style={{ fontSize: '0.75rem' }}
                      >
                        {receipt.status === 'Processed' ? 'cleared' : 'uncleared'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
        <Card.Footer className="bg-white py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="small text-muted mb-3 mb-md-0">
              Showing {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredReceipts.length)} of{' '}
              {filteredReceipts.length} receipts
            </div>
            <div className="d-flex justify-content-center">
              <Pagination className="mb-0 pagination-custom">
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {paginationItems}
                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                />
              </Pagination>
            </div>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
}

export default ReceiptHistory;
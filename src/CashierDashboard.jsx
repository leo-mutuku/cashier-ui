import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Container, Card, Spinner, Alert, Form, InputGroup, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { baseUrl } from '../baseUrl';
import axios from 'axios';

function Cashier() {
  const leftItemsPerPage = 8;
  const rightItemsPerPage = 5;

  const [salesOrders, setSalesOrders] = useState([]);
  const [filteredSalesOrders, setFilteredSalesOrders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLeft, setPageLeft] = useState(1);
  const [pageRight, setPageRight] = useState(1);
  const [cash, setCash] = useState(0);
  const [mpesa, setMpesa] = useState(0);

  // Format date and time
  const formatDateTime = (date) => {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Create tooltip content for order details
  const renderOrderTooltip = (orderDetails) => (
    <Tooltip id="order-tooltip" style={{ fontSize: '12px' }}>
      <div style={{ textAlign: 'left', maxWidth: '200px' }}>
        <strong>Order Details:</strong>
        {orderDetails.map((item, index) => (
          <div key={index} style={{ marginTop: '4px', borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>
            <div><strong>{item.menu_name}</strong></div>
            <div>Qty: {item.quantity} × KSh {item.price} = KSh {item.total}</div>
          </div>
        ))}
      </div>
    </Tooltip>
  );

  // Fetch sales orders on mount
  useEffect(() => {
    fetchSalesOrders();
  }, []);

  // Filter sales orders by search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSalesOrders(salesOrders);
    } else {
      const filtered = salesOrders.filter(order =>
        order.billNo.toString().includes(searchTerm.trim())
      );
      setFilteredSalesOrders(filtered);
      setPageLeft(1);
    }
  }, [searchTerm, salesOrders]);

  const fetchSalesOrders = async (loadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = userData?.data?.token;

      const response = await axios.get(
        `${baseUrl}/api/v1/salesorder/getpostedsalesorders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const formattedData = response.data.data.map(order => ({
        billNo: order.sales_order_entry_id,
        amount: parseFloat(order.total_value),
        customer: order.waiter,
        date: new Date(order.created_at),
        status: order.status,
        orderDetails: order.order_details,
        id: order.sales_order_entry_id,
      }));

      if (loadMore) {
        setSalesOrders(prev => [...prev, ...formattedData]);
        if (offset >= 2) setHasMore(false);
        setOffset(prev => prev + 1);
      } else {
        setSalesOrders(formattedData);
        setFilteredSalesOrders(formattedData);
        setOffset(1);
        setHasMore(true);
      }
    } catch (err) {
      console.error('Error fetching sales orders:', err);
      setError('Failed to load sales orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paginate = (data, page, itemsPerPage) => {
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  };

  const totalLeftPages = Math.ceil(filteredSalesOrders.length / leftItemsPerPage);
  const totalRightPages = Math.ceil(selectedItems.length / rightItemsPerPage);
  const totalAmount = selectedItems.reduce((acc, item) => acc + item.amount, 0);

  const addItem = (item) => {
    if (!selectedItems.some(selected => selected.billNo === item.billNo)) {
      setSelectedItems([...selectedItems, item]);
      setPageRight(1);
    }
  };

  const removeItem = (billNo) => {
    setSelectedItems(selectedItems.filter(item => item.billNo !== billNo));
    const newTotalPages = Math.ceil((selectedItems.length - 1) / rightItemsPerPage);
    if (pageRight > newTotalPages && newTotalPages > 0) setPageRight(newTotalPages);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    if (cash + mpesa !== totalAmount) {
      setError('Bill total does not equal payment total!');
      return;
    }

    setSubmitLoading(true);
    setSubmitSuccess(false);

    try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = userData?.data?.token;
      const billIds = selectedItems.map(item => Number(item.billNo));

      const payload = { cash, mpesa, bill_ids: billIds };

      await axios.post(`${baseUrl}/api/v1/cashier/clearbill`, payload,
          { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmitSuccess(true);
      setSelectedItems([]);
      fetchSalesOrders();

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting receipts:', err);
      setError('Failed to submit receipts. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLoadMore = () => fetchSalesOrders(true);
  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleAddBySearch = () => {
    if (!searchTerm.trim()) return;
    const foundItem = salesOrders.find(item => item.billNo.toString() === searchTerm.trim());
    if (foundItem) {
      addItem(foundItem);
      setSearchTerm('');
    } else {
      setError(`Receipt #${searchTerm} not found`);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <Container fluid className="px-2 py-3">
      <h4 className="text-center mb-3">Cashier Panel</h4>

      {submitSuccess && <Alert variant="success">Receipts processed successfully!</Alert>}
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Search */}
      <Row className="mb-3">
        <Col>
          <InputGroup>
            <Form.Control
              placeholder="Search by receipt #..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyPress={(e) => e.key === 'Enter' && handleAddBySearch()}
            />
            <Button variant="primary" onClick={handleAddBySearch}>Add Receipt</Button>
          </InputGroup>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Left Table - Available */}
        <Col xs={12} md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light"><h5>Available Receipts</h5></Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table size="sm" hover className="mb-0">
                  <thead className="sticky-top bg-light">
                    <tr>
                      <th>Receipt #</th>
                      <th>Amount</th>
                      <th>Waiter</th>
                      <th>Date & Time</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && salesOrders.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4"><Spinner animation="border" size="sm" /> Loading receipts...</td></tr>
                    ) : filteredSalesOrders.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-3 text-muted">{searchTerm ? 'No matching receipts found' : 'No receipts available'}</td></tr>
                    ) : (
                      paginate(filteredSalesOrders, pageLeft, leftItemsPerPage).map(item => (
                        <OverlayTrigger
                          key={item.billNo}
                          placement="top"
                          delay={{ show: 250, hide: 400 }}
                          overlay={renderOrderTooltip(item.orderDetails)}
                        >
                          <tr style={{ cursor: 'pointer' }}>
                            <td>{item.billNo}</td>
                            <td>KSh {item.amount.toFixed(2)}</td>
                            <td>{item.customer}</td>
                            <td style={{ fontSize: '11px' }}>{formatDateTime(item.date)}</td>
                            <td className="text-center">
                              <Button variant="success" size="sm" onClick={() => addItem(item)} disabled={selectedItems.some(si => si.billNo === item.billNo)}>+</Button>
                            </td>
                          </tr>
                        </OverlayTrigger>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white d-flex justify-content-between">
              <Button variant="outline-secondary" size="sm" onClick={() => setPageLeft(Math.max(1, pageLeft - 1))} disabled={pageLeft === 1}>Prev</Button>
              <span className="text-muted small">Page {pageLeft} of {totalLeftPages || 1}</span>
              <Button variant="outline-secondary" size="sm" onClick={() => setPageLeft(Math.min(totalLeftPages, pageLeft + 1))} disabled={pageLeft === totalLeftPages}>Next</Button>
            </Card.Footer>
          </Card>
        </Col>

        {/* Right Table - Selected */}
        <Col xs={12} md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5>Selected Receipts</h5>
              <span className="fw-bold">Total: KSh {totalAmount.toFixed(2)}</span>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table size="sm" hover className="mb-0">
                  <thead className="sticky-top bg-light">
                    <tr>
                      <th>Receipt #</th>
                      <th>Amount</th>
                      <th>Waiter</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-3 text-muted">No receipts selected</td></tr>
                    ) : (
                      paginate(selectedItems, pageRight, rightItemsPerPage).map(item => (
                        <tr key={item.billNo}>
                          <td>{item.billNo}</td>
                          <td>KSh {item.amount.toFixed(2)}</td>
                          <td>{item.customer}</td>
                          <td className="text-center">
                            <Button variant="danger" size="sm" onClick={() => removeItem(item.billNo)}>×</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Row className="mb-2">
                <Col>
                  <Form.Group>
                    <Form.Label>Cash</Form.Label>
                    <Form.Control type="number" value={cash} onChange={(e) => setCash(parseFloat(e.target.value) )} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Mpesa</Form.Label>
                    <Form.Control type="number" value={mpesa} onChange={(e) => setMpesa(parseFloat(e.target.value) )} />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-between">
                <Button variant="warning" size="sm" disabled={selectedItems.length === 0} onClick={() => setSelectedItems([])}>Reset</Button>
                <Button variant={submitLoading ? "secondary" : "primary"} size="sm" disabled={selectedItems.length === 0 || submitLoading} onClick={handleSubmit}>
                  {submitLoading ? <><Spinner as="span" animation="border" size="sm" className="me-1" />Submitting...</> : "Submit"}
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col>
          <Button variant="primary" size="lg" className="w-100" onClick={handleLoadMore} disabled={loading || !hasMore}>
            {loading ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Loading...</> : !hasMore ? "No More Receipts" : "Load More Receipts"}
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default Cashier;
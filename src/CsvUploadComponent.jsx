import { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import debounce from 'lodash/debounce';
import { baseUrl } from '../baseUrl';

function CsvUploadComponent() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const entriesPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  // Fetch sales orders on component mount
  useEffect(() => {
    fetchSalesOrders();
    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchSalesOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/sales-orders`);
      if (!response.ok) throw new Error('Failed to fetch sales orders');
      const data = await response.json();
      setSalesOrders(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load sales orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setError('No file selected');
      setFile(null);
      return;
    }

    // Validate file type (MIME type and extension)
    const validMimeTypes = ['text/csv', 'application/csv'];
    const validExtension = selectedFile.name.toLowerCase().endsWith('.csv');
    if (!validMimeTypes.includes(selectedFile.type) || !validExtension) {
      setError('Please select a valid CSV file');
      setFile(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > maxFileSize) {
      setError('File size exceeds 10MB limit');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
    setMessage('');
    setDuplicates([]);
    setUploadProgress(0);
  };

  const handleUpload = debounce(async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');
    setDuplicates([]);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('csvFile', file);

    // Initialize AbortController for canceling
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${baseUrl}/api/upload-csv`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(progress);
          }
        },
      });

      const result = await response.json();

      if (response.status === 409) {
        setError(result.message);
        setDuplicates(result.duplicates || []);
      } else if (!response.ok) {
        throw new Error(result.message || 'Failed to upload file');
      } else {
        setMessage(result.message);
        if (result.duplicates?.length) {
          setDuplicates(result.duplicates);
        }
      }

      fetchSalesOrders();
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessage('Upload canceled');
      } else {
        setError(
          err.message.includes('network')
            ? 'Network error: Unable to reach the server'
            : err.message || 'An error occurred during upload'
        );
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  }, 300);

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Pagination Logic
  const totalPages = Math.ceil(salesOrders.length / entriesPerPage);

  const paginatedOrders = salesOrders.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // Function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const maxPagesToShow = 10;
    let pageNumbers = [];

    if (totalPages <= maxPagesToShow) {
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pageNumbers.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = Math.min(maxPagesToShow - 1, totalPages - 1);
      }

      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - (maxPagesToShow - 2));
      }

      if (start > 2) {
        pageNumbers.push('...');
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }

      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="row g-4">
      {/* Upload Card */}
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Upload Sales Data CSV</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="fileInput" className="form-label">
                Select CSV File (Max 10MB)
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="form-control"
                disabled={isUploading}
              />
            </div>

            <div className="d-flex gap-2">
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="btn btn-primary w-100"
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
              {isUploading && (
                <button
                  onClick={handleCancelUpload}
                  className="btn btn-secondary w-100"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="progress mt-3">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {uploadProgress}%
                </div>
              </div>
            )}

            {/* Feedback Messages */}
            {message && (
              <div className="alert alert-success mt-3">{message}</div>
            )}

            {error && (
              <div className="alert alert-danger mt-3">{error}</div>
            )}

            {duplicates.length > 0 && (
              <div className="alert alert-warning mt-3">
                <strong>Duplicate Receipt Numbers:</strong>
                <p className="mb-2">These entries were skipped:</p>
                <ul className="mb-0 ps-3">
                  {duplicates.slice(0, 10).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                  {duplicates.length > 10 && (
                    <li>...and {duplicates.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Sales Orders</h5>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2">Loading sales data...</p>
              </div>
            ) : salesOrders.length === 0 ? (
              <div className="text-center py-4 text-muted">No sales orders found</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th className="text-end">Amount</th>
                      <th>Payment Methods</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.receipt_number}>
                        <td>{order.receipt_number}</td>
                        <td>{formatDate(order.date)}</td>
                        <td>{order.customer_name}</td>
                        <td className="text-end">Ksh {parseFloat(order.amount).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td>{order.payment_methods}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="mt-4 d-flex justify-content-center">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-label="Previous"
                    >
                      <span aria-hidden="true">«</span>
                    </button>
                  </li>

                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <li key={`ellipsis-${index}`} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(page)}>
                          {page}
                        </button>
                      </li>
                    )
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-label="Next"
                    >
                      <span aria-hidden="true">»</span>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CsvUploadComponent;
// Settings.jsx
function Settings() {
    return (
      <div>
        <h2>Settings</h2>
        <form>
          <div className="mb-3">
            <label htmlFor="storeName" className="form-label">Store Name</label>
            <input type="text" className="form-control" id="storeName" placeholder="Your Store" />
          </div>
          <div className="mb-3">
            <label htmlFor="currency" className="form-label">Currency</label>
            <select className="form-select" id="currency">
            <option value="USD">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </form>
      </div>
    );
  }
  
  export default Settings;
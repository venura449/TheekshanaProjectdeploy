import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { processExcelData } from './utils/dataProcessor';
import './App.css';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (file) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const processedData = await processExcelData(file);
      setDashboardData(processedData);
    } catch (err) {
      setError(err.message || 'Failed to process Excel file. Please ensure the file format is correct.');
      console.error('Error processing file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <p>Please ensure your Excel file contains the following columns:</p>
          <ul>
            <li>District</li>
            <li>Nature of Business</li>
            <li>Industry Scale</li>
            <li>Nature of Impact</li>
            <li>Possible Restart Date</li>
            <li>Market Types (or Market Type)</li>
            <li>Local Loss (or Local Loss (USD) or Local loss)</li>
            <li>Export Revenue Loss (USD) (or Export Loss or Export Revenue Loss)</li>
          </ul>
        </div>
      )}
      <Dashboard data={dashboardData} />
    </div>
  );
}

export default App;

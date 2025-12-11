import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { processExcelData, combineExcelFiles } from './utils/dataProcessor';
import './App.css';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCombinedMode, setIsCombinedMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [combinedFileBlob, setCombinedFileBlob] = useState(null);

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

  const handleMultipleFilesSelect = async (files) => {
    setError(null);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleCombineAndDownload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to combine');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const combinedBlob = await combineExcelFiles(selectedFiles);
      setCombinedFileBlob(combinedBlob);
      
      // Trigger download
      const url = window.URL.createObjectURL(combinedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `combined_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Process the combined file for dashboard
      const combinedFile = new File([combinedBlob], 'combined.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const processedData = await processExcelData(combinedFile);
      setDashboardData(processedData);
    } catch (err) {
      setError(err.message || 'Failed to combine Excel files. Please ensure all files are valid Excel files.');
      console.error('Error combining files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsCombinedMode(!isCombinedMode);
    setSelectedFiles([]);
    setCombinedFileBlob(null);
    setDashboardData(null);
    setError(null);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setCombinedFileBlob(null);
  };

  return (
    <div className="app">
      <FileUpload 
        onFileSelect={handleFileSelect}
        onMultipleFilesSelect={handleMultipleFilesSelect}
        isLoading={isLoading}
        isCombinedMode={isCombinedMode}
        onToggleMode={handleToggleMode}
      />
      
      {isCombinedMode && (
        <div className="combined-mode-container">
          {selectedFiles.length > 0 && (
            <>
              <div className="selected-files-list">
                <h3>Selected Files ({selectedFiles.length})</h3>
                <div className="files-list">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button 
                        onClick={() => handleRemoveFile(index)}
                        className="remove-file-button"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="combined-mode-actions">
                  <button
                    onClick={handleCombineAndDownload}
                    disabled={isLoading || selectedFiles.length === 0}
                    className="combine-button"
                  >
                    {isLoading ? 'Processing...' : 'Combine & Download'}
                  </button>
                  <button
                    onClick={handleClearFiles}
                    disabled={isLoading}
                    className="clear-files-button"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          {!isCombinedMode && (
            <>
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
            </>
          )}
        </div>
      )}
      <Dashboard data={dashboardData} />
    </div>
  );
}

export default App;

import { useRef } from 'react';
import './FileUpload.css';

const FileUpload = ({ onFileSelect, onMultipleFilesSelect, isLoading, isCombinedMode, onToggleMode }) => {
  const fileInputRef = useRef(null);
  const multipleFileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onMultipleFilesSelect(files);
    }
  };

  const handleClick = () => {
    if (isCombinedMode) {
      multipleFileInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={multipleFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleMultipleFileChange}
        multiple
        style={{ display: 'none' }}
      />
      <div className="upload-buttons-row">
        <button 
          onClick={handleClick} 
          disabled={isLoading}
          className="upload-button"
        >
          {isLoading ? 'Processing...' : isCombinedMode ? 'Add XLSX Files' : 'Upload XLSX File'}
        </button>
        <button
          onClick={onToggleMode}
          disabled={isLoading}
          className={`mode-toggle-button ${isCombinedMode ? 'active' : ''}`}
        >
          Combined Mode
        </button>
      </div>
      <p className="upload-hint">
        {isCombinedMode 
          ? 'Select multiple Excel files (.xlsx) to combine them into one file'
          : 'Select an Excel file (.xlsx) to load dashboard data'}
      </p>
    </div>
  );
};

export default FileUpload;


import { useRef } from 'react';
import './FileUpload.css';

const FileUpload = ({ onFileSelect, isLoading }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
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
      <button 
        onClick={handleClick} 
        disabled={isLoading}
        className="upload-button"
      >
        {isLoading ? 'Processing...' : 'Upload XLSX File'}
      </button>
      <p className="upload-hint">Select an Excel file (.xlsx) to load dashboard data</p>
    </div>
  );
};

export default FileUpload;


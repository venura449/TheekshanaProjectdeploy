import { useEffect, useState } from 'react';
import { findColumn, normalizeKey } from '../utils/dataProcessor';
import './ColumnDebugger.css';

const ColumnDebugger = ({ rawData }) => {
  const [detectedColumns, setDetectedColumns] = useState(null);
  const [sampleRow, setSampleRow] = useState(null);

  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const columns = Object.keys(rawData[0]);
      const sample = rawData[0];
      
      // Detect which columns match our expected patterns
      const detected = {
        district: findColumn(sample, ['District', 'district']) !== null ? 
          columns.find(col => normalizeKey(col).includes('district')) : null,
        natureOfBusiness: findColumn(sample, ['Nature of Business', 'Business Nature']) !== null ?
          columns.find(col => normalizeKey(col).includes('nature') && normalizeKey(col).includes('business')) : null,
        industryScale: findColumn(sample, ['Industry Scale', 'Scale']) !== null ?
          columns.find(col => normalizeKey(col).includes('scale')) : null,
        natureOfImpact: findColumn(sample, ['Nature of Impact', 'Impact']) !== null ?
          columns.find(col => normalizeKey(col).includes('impact') || normalizeKey(col).includes('damage')) : null,
        restartDate: findColumn(sample, ['Possible Restart Date', 'Restart Date']) !== null ?
          columns.find(col => normalizeKey(col).includes('restart') || normalizeKey(col).includes('date')) : null,
        marketType: findColumn(sample, ['Market Types', 'Market Type']) !== null ?
          columns.find(col => normalizeKey(col).includes('market')) : null,
        localLoss: findColumn(sample, ['Local Revenue Loss (LKR)', 'Local Loss']) !== null ?
          columns.find(col => {
            const norm = normalizeKey(col);
            return (norm.includes('local') && (norm.includes('loss') || norm.includes('revenue')));
          }) : null,
        exportLoss: findColumn(sample, ['Export Revenue Loss (USD)', 'Export Loss']) !== null ?
          columns.find(col => {
            const norm = normalizeKey(col);
            return (norm.includes('export') && (norm.includes('loss') || norm.includes('revenue')));
          }) : null,
      };
      
      setDetectedColumns(detected);
      setSampleRow(sample);
    }
  }, [rawData]);

  if (!rawData || rawData.length === 0) {
    return null;
  }

  const allColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  return (
    <div className="column-debugger">
      <h4>Column Detection Debug</h4>
      <div className="debug-section">
        <h5>All Available Columns ({allColumns.length}):</h5>
        <ul className="column-list">
          {allColumns.map((col, idx) => (
            <li key={idx} className={detectedColumns && Object.values(detectedColumns).includes(col) ? 'detected' : ''}>
              {col}
              {sampleRow && <span className="sample-value">: {sampleRow[col]}</span>}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="debug-section">
        <h5>Detected Mappings:</h5>
        <div className="mappings">
          <div className="mapping-item">
            <strong>District:</strong> {detectedColumns?.district || <span className="not-found">Not found</span>}
          </div>
          <div className="mapping-item">
            <strong>Nature of Business:</strong> {detectedColumns?.natureOfBusiness || <span className="not-found">Not found</span>}
          </div>
          <div className="mapping-item">
            <strong>Industry Scale:</strong> {detectedColumns?.industryScale || <span className="not-found">Not found</span>}
          </div>
          <div className="mapping-item">
            <strong>Nature of Impact:</strong> {detectedColumns?.natureOfImpact || <span className="not-found">Not found</span>}
          </div>
          <div className="mapping-item">
            <strong>Restart Date:</strong> {detectedColumns?.restartDate || <span className="not-found">Not found</span>}
          </div>
          <div className="mapping-item">
            <strong>Market Type:</strong> {detectedColumns?.marketType || <span className="not-found">Not found</span>}
          </div>
          <div className="mapping-item">
            <strong>Local Loss:</strong> {detectedColumns?.localLoss || <span className="not-found">Not found</span>}
          </div>
          <div className="mapping-item">
            <strong>Export Loss:</strong> {detectedColumns?.exportLoss || <span className="not-found">Not found</span>}
          </div>
        </div>
      </div>
      
      {sampleRow && (
        <div className="debug-section">
          <h5>Sample Row Values:</h5>
          <div className="sample-values">
            {Object.entries(sampleRow).slice(0, 10).map(([key, value]) => (
              <div key={key} className="sample-item">
                <strong>{key}:</strong> {value !== null && value !== undefined ? value.toString() : '(empty)'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnDebugger;


import { useState } from 'react';
import { findColumn, normalizeKey } from '../utils/dataProcessor';
import './Filters.css';

const Filters = ({ rawData, onFilterChange }) => {
  const [filters, setFilters] = useState({
    district: 'All',
    natureOfBusiness: 'All',
    industryScale: 'All',
    marketType: 'All',
    natureOfImpact: 'All'
  });

  // Extract unique values for filter options
  const districts = ['All', ...new Set(rawData?.map(row => 
    findColumn(row, ['District', 'district']) || 'Unknown'
  ).filter(Boolean))];

  const natureOfBusinessOptions = ['All', ...new Set(rawData?.map(row => 
    findColumn(row, ['Nature of Business', 'Business Nature']) || 'Unknown'
  ).filter(Boolean))];

  const industryScaleOptions = ['All', ...new Set(rawData?.map(row => 
    findColumn(row, ['Industry Scale', 'Scale', 'Business Scale']) || 'Unknown'
  ).filter(Boolean))];

  const marketTypeOptions = ['All', ...new Set(rawData?.map(row => 
    findColumn(row, ['Market Types', 'Market Type', 'Market', 'Market Category']) || 'Unknown'
  ).filter(Boolean))];

  const natureOfImpactOptions = ['All', ...new Set(rawData?.map(row => 
    findColumn(row, ['Nature of Impact', 'Impact', 'Damage Level']) || 'Unknown'
  ).filter(Boolean))];

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      district: 'All',
      natureOfBusiness: 'All',
      industryScale: 'All',
      marketType: 'All',
      natureOfImpact: 'All'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  if (!rawData || rawData.length === 0) {
    return null;
  }

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3>Filters</h3>
        <button onClick={handleReset} className="reset-button">Reset All</button>
      </div>
      <div className="filters-grid">
        <div className="filter-group">
          <label>District</label>
          <select
            value={filters.district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="filter-select"
          >
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Nature of Business</label>
          <select
            value={filters.natureOfBusiness}
            onChange={(e) => handleFilterChange('natureOfBusiness', e.target.value)}
            className="filter-select"
          >
            {natureOfBusinessOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Industry Scale</label>
          <select
            value={filters.industryScale}
            onChange={(e) => handleFilterChange('industryScale', e.target.value)}
            className="filter-select"
          >
            {industryScaleOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Market Type</label>
          <select
            value={filters.marketType}
            onChange={(e) => handleFilterChange('marketType', e.target.value)}
            className="filter-select"
          >
            {marketTypeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Nature of Impact</label>
          <select
            value={filters.natureOfImpact}
            onChange={(e) => handleFilterChange('natureOfImpact', e.target.value)}
            className="filter-select"
          >
            {natureOfImpactOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Filters;


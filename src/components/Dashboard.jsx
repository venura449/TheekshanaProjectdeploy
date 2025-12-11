import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Filters from './Filters';
import ColumnDebugger from './ColumnDebugger';
import { reprocessData } from '../utils/dataProcessor';
import './Dashboard.css';

const Dashboard = ({ data }) => {
  const [filters, setFilters] = useState({
    district: 'All',
    natureOfBusiness: 'All',
    industryScale: 'All',
    marketType: 'All',
    natureOfImpact: 'All'
  });

  const formatCurrency = (value) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const formatNumber = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Colors matching the design
  const COLORS = {
    nature: ['#0088FE', '#00C49F', '#FFBB28'],
    market: ['#0088FE', '#00C49F', '#FFBB28'],
    default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
  };

  // Process data with filters
  const processedData = useMemo(() => {
    if (!data) return null;
    
    // Use originalRawData if available (for filtering), otherwise use rawData
    const sourceData = data.originalRawData || data.rawData;
    if (!sourceData) return null;
    
    // Check if any filter is active
    const hasActiveFilters = Object.values(filters).some(filter => filter !== 'All');
    
    if (hasActiveFilters) {
      return reprocessData(sourceData, filters);
    }
    
    return data;
  }, [data, filters]);

  const kpis = useMemo(() => {
    if (!processedData?.kpis) return null;
    return processedData.kpis;
  }, [processedData]);

  const charts = useMemo(() => {
    if (!processedData?.charts) return null;
    return processedData.charts;
  }, [processedData]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (!data || !kpis || !charts) {
    return (
      <div className="dashboard-empty">
        <p>Please upload an XLSX file to view the dashboard</p>
      </div>
    );
  }

  // Custom label for donut charts
  const renderCustomLabel = (entry, chartType) => {
    if (chartType === 'nature') {
      const total = charts.localLossByNature.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(2) : 0;
      return `${entry.name}: ${formatCurrency(entry.value)} (${percentage}%)`;
    } else if (chartType === 'market') {
      const total = charts.businessesByMarketType.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
      return `${entry.name}: ${entry.value} (${percentage}%)`;
    }
    return '';
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Business Survey Dashboard</h1>
      
      {/* Filters Section */}
      <Filters rawData={data.originalRawData || data.rawData} onFilterChange={handleFilterChange} />
      
      {/* KPIs Section */}
      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-label">Total Local loss</div>
          <div className="kpi-value">{formatCurrency(kpis.totalLocalLoss)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Export Loss</div>
          <div className="kpi-value">{formatCurrency(kpis.totalExportLoss)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Businesses</div>
          <div className="kpi-value">{formatNumber(kpis.totalBusinesses)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Loss per Business</div>
          <div className="kpi-value">{formatCurrency(kpis.averageLossPerBusiness)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Restart Rate (%)</div>
          <div className="kpi-value">{kpis.restartRate !== null ? `${kpis.restartRate}%` : '--'}</div>
        </div>
      </div>

      {/* Charts Section - Top Row (Full Width) */}
      <div className="charts-row">
        {/* Export Loss by District - Horizontal Bar Chart */}
        <div className="chart-card full-width">
          <h3 className="chart-title">Sum of Export Revenue Loss (USD) by District</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={charts.exportLossByDistrict}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#666"
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100}
                stroke="#666"
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <Bar dataKey="value" fill="#0088FE" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section - Middle Row (3 Columns) */}
      <div className="charts-row three-columns">
        {/* Local Loss by Nature of Business - Donut Chart */}
        <div className="chart-card third-width">
          <h3 className="chart-title">Total Local loss by Nature of Business</h3>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={charts.localLossByNature}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => renderCustomLabel(entry, 'nature')}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {charts.localLossByNature.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.nature[index % COLORS.nature.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconSize={10}
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value, entry) => {
                    const data = charts.localLossByNature.find(d => d.name === value);
                    const total = charts.localLossByNature.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((data?.value || 0) / total * 100).toFixed(2) : 0;
                    return `${value}: ${formatCurrency(data?.value || 0)} (${percentage}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Local Loss by Industry Scale - Vertical Bar Chart */}
        <div className="chart-card third-width">
          <h3 className="chart-title">Total Local loss by Industry Scale</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={charts.localLossByScale} 
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#666"
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section - Bottom Row (3 Columns) */}
      <div className="charts-row three-columns">
        {/* Businesses by Nature of Impact - Horizontal Bar Chart */}
        <div className="chart-card third-width">
          <h3 className="chart-title">Total Businesses by Nature of Impact</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={charts.businessesByImpact}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" stroke="#666" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={110}
                stroke="#666"
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <Bar dataKey="value" fill="#FF8042" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Businesses by Restart Date - Vertical Bar Chart */}
        {charts.businessesByRestartDate && charts.businessesByRestartDate.length > 0 ? (
          <div className="chart-card third-width">
            <h3 className="chart-title">Total Businesses by Possible Restart Date</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={charts.businessesByRestartDate} 
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  stroke="#666"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 9 }}
                />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString();
                  }}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-card third-width">
            <h3 className="chart-title">Total Businesses by Possible Restart Date</h3>
            <div className="chart-empty">No restart date data available</div>
          </div>
        )}

        {/* Businesses by Market Types - Donut Chart */}
        <div className="chart-card third-width">
          <h3 className="chart-title">Total Businesses by Market Types</h3>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={charts.businessesByMarketType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => renderCustomLabel(entry, 'market')}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {charts.businessesByMarketType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.market[index % COLORS.market.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconSize={10}
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value, entry) => {
                    const data = charts.businessesByMarketType.find(d => d.name === value);
                    const total = charts.businessesByMarketType.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((data?.value || 0) / total * 100).toFixed(1) : 0;
                    return `${value}: ${data?.value || 0} (${percentage}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

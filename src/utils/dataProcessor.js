import * as XLSX from 'xlsx';

/**
 * Process Excel file and extract data
 * Expected columns in Excel:
 * - District
 * - Nature of Business (Trading, Manufacturing, Services)
 * - Industry Scale (Micro, Small, Medium, Large)
 * - Nature of Impact (Minor damage, Partial damage, Severe damage)
 * - Possible Restart Date
 * - Market Types (Local, Export, Local & Export)
 * - Local Loss (numeric)
 * - Export Revenue Loss (USD) (numeric)
 */
export const processExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Debug: Log available columns
        if (jsonData.length > 0) {
          console.log('Available columns in Excel:', Object.keys(jsonData[0]));
        }
        
        // Process the data
        const processedData = processData(jsonData);
        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// Helper function to normalize column names
export const normalizeKey = (key) => {
  if (!key) return null;
  return key.toString().toLowerCase().trim();
};

// Find column by multiple possible names (case-insensitive)
export const findColumn = (row, possibleNames) => {
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    normalizedRow[normalizeKey(key)] = row[key];
  });
  
  for (const name of possibleNames) {
    const normalizedName = normalizeKey(name);
    if (normalizedRow[normalizedName] !== undefined) {
      return row[Object.keys(row).find(k => normalizeKey(k) === normalizedName)];
    }
  }
  return null;
};

export const applyFilters = (rawData, filters) => {
  if (!rawData || rawData.length === 0) return rawData;
  
  return rawData.filter(row => {
    if (filters.district !== 'All') {
      const district = findColumn(row, ['District', 'district']);
      if (district !== filters.district) return false;
    }
    
    if (filters.natureOfBusiness !== 'All') {
      const nature = findColumn(row, ['Nature of Business', 'Business Nature']);
      if (nature !== filters.natureOfBusiness) return false;
    }
    
    if (filters.industryScale !== 'All') {
      const scale = findColumn(row, ['Industry Scale', 'Scale', 'Business Scale']);
      if (scale !== filters.industryScale) return false;
    }
    
    if (filters.marketType !== 'All') {
      const market = findColumn(row, ['Market Types', 'Market Type', 'Market', 'Market Category']);
      if (market !== filters.marketType) return false;
    }
    
    if (filters.natureOfImpact !== 'All') {
      const impact = findColumn(row, ['Nature of Impact', 'Impact', 'Damage Level']);
      if (impact !== filters.natureOfImpact) return false;
    }
    
    return true;
  });
};

const processData = (rawData, filters = null) => {
  if (!rawData || rawData.length === 0) {
    throw new Error('No data found in Excel file');
  }

  // Debug: Detect actual column names
  const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
  console.log('Detected columns:', availableColumns);
  
  // Try to detect column mappings
  const columnMappings = detectColumnMappings(availableColumns);
  console.log('Column mappings detected:', columnMappings);

  // Apply filters if provided
  const filteredData = filters ? applyFilters(rawData, filters) : rawData;
  
  if (filteredData.length === 0) {
    return {
      kpis: {
        totalLocalLoss: 0,
        totalExportLoss: 0,
        totalBusinesses: 0,
        averageLossPerBusiness: 0,
        restartRate: null
      },
      charts: {
        exportLossByDistrict: [],
        localLossByNature: [],
        localLossByScale: [],
        businessesByImpact: [],
        businessesByRestartDate: [],
        businessesByMarketType: []
      },
      rawData: filteredData,
      originalRawData: rawData
    };
  }

  // Calculate KPIs with better column detection
  const totalLocalLoss = filteredData.reduce((sum, row) => {
    // Try multiple column name variations
    const loss = findColumn(row, [
      'Local Revenue Loss (LKR)',
      'Local Loss',
      'Local Loss (USD)',
      'Local loss',
      'Local Revenue Loss',
      'Local Revenue Loss (USD)',
      'Local Loss (LKR)',
      'Local Revenue Loss LKR',
      'LocalLoss',
      'Local_Revenue_Loss',
      'Local Revenue Loss LKR'
    ]);
    const numLoss = parseFloat(loss) || 0;
    if (numLoss > 0) {
      console.log('Found local loss value:', numLoss, 'from column:', Object.keys(row).find(k => normalizeKey(k) === normalizeKey(loss?.toString() || '')));
    }
    return sum + (isNaN(numLoss) ? 0 : numLoss);
  }, 0);

  const totalExportLoss = filteredData.reduce((sum, row) => {
    // Try multiple column name variations
    const loss = findColumn(row, [
      'Export Revenue Loss (USD)',
      'Export Loss',
      'Export Revenue Loss',
      'Export Loss (USD)',
      'Export Revenue Loss USD',
      'ExportLoss',
      'Export_Revenue_Loss',
      'Export Revenue Loss USD'
    ]);
    const numLoss = parseFloat(loss) || 0;
    return sum + (isNaN(numLoss) ? 0 : numLoss);
  }, 0);
  
  console.log('Total Local Loss calculated:', totalLocalLoss);
  console.log('Total Export Loss calculated:', totalExportLoss);

  const totalBusinesses = filteredData.length;
  const averageLossPerBusiness = totalBusinesses > 0 ? totalLocalLoss / totalBusinesses : 0;

  // Process charts data
  const exportLossByDistrict = processExportLossByDistrict(filteredData);
  const localLossByNature = processLocalLossByNature(filteredData);
  const localLossByScale = processLocalLossByScale(filteredData);
  const businessesByImpact = processBusinessesByImpact(filteredData);
  const businessesByRestartDate = processBusinessesByRestartDate(filteredData);
  const businessesByMarketType = processBusinessesByMarketType(filteredData);

  return {
    kpis: {
      totalLocalLoss,
      totalExportLoss,
      totalBusinesses,
      averageLossPerBusiness,
      restartRate: null // Calculate if restart date data is available
    },
    charts: {
      exportLossByDistrict,
      localLossByNature,
      localLossByScale,
      businessesByImpact,
      businessesByRestartDate,
      businessesByMarketType
    },
    rawData: filteredData,
    originalRawData: rawData // Always store original unfiltered data
  };
};

// Detect column mappings from available columns
const detectColumnMappings = (availableColumns) => {
  const mappings = {
    district: null,
    natureOfBusiness: null,
    industryScale: null,
    natureOfImpact: null,
    restartDate: null,
    marketType: null,
    localLoss: null,
    exportLoss: null
  };

  const normalize = (str) => str?.toString().toLowerCase().trim().replace(/[_\s-]/g, '');

  availableColumns.forEach(col => {
    const normalized = normalize(col);
    
    // District detection
    if (!mappings.district && (normalized.includes('district') || normalized.includes('location'))) {
      mappings.district = col;
    }
    
    // Nature of Business detection
    if (!mappings.natureOfBusiness && (
      normalized.includes('nature') && normalized.includes('business') ||
      normalized.includes('businesstype') ||
      normalized.includes('type') && normalized.includes('business')
    )) {
      mappings.natureOfBusiness = col;
    }
    
    // Industry Scale detection
    if (!mappings.industryScale && (
      normalized.includes('scale') ||
      normalized.includes('size') ||
      (normalized.includes('industry') && normalized.includes('scale'))
    )) {
      mappings.industryScale = col;
    }
    
    // Nature of Impact detection
    if (!mappings.natureOfImpact && (
      (normalized.includes('nature') && normalized.includes('impact')) ||
      normalized.includes('impact') ||
      normalized.includes('damage')
    )) {
      mappings.natureOfImpact = col;
    }
    
    // Restart Date detection
    if (!mappings.restartDate && (
      normalized.includes('restart') ||
      normalized.includes('reopen') ||
      (normalized.includes('date') && (normalized.includes('restart') || normalized.includes('possible')))
    )) {
      mappings.restartDate = col;
    }
    
    // Market Type detection
    if (!mappings.marketType && (
      normalized.includes('market') ||
      normalized.includes('customer') ||
      (normalized.includes('type') && normalized.includes('market'))
    )) {
      mappings.marketType = col;
    }
    
    // Local Loss detection
    if (!mappings.localLoss && (
      normalized.includes('local') && (normalized.includes('loss') || normalized.includes('revenue')) ||
      normalized.includes('localloss') ||
      normalized.includes('localrevenueloss') ||
      (normalized.includes('loss') && normalized.includes('lkr'))
    )) {
      mappings.localLoss = col;
    }
    
    // Export Loss detection
    if (!mappings.exportLoss && (
      normalized.includes('export') && (normalized.includes('loss') || normalized.includes('revenue')) ||
      normalized.includes('exportloss') ||
      normalized.includes('exportrevenueloss') ||
      (normalized.includes('export') && normalized.includes('usd'))
    )) {
      mappings.exportLoss = col;
    }
  });

  return mappings;
};

// Export function to reprocess data with filters
export const reprocessData = (rawData, filters) => {
  return processData(rawData, filters);
};

const processExportLossByDistrict = (data) => {
  const districtMap = {};
  
  data.forEach(row => {
    const district = findColumn(row, [
      'District',
      'district',
      'Location',
      'Province',
      'Region'
    ]) || 'Unknown';
    const loss = findColumn(row, [
      'Export Revenue Loss (USD)',
      'Export Loss',
      'Export Revenue Loss',
      'Export Loss (USD)',
      'Export Revenue Loss USD',
      'ExportLoss',
      'Export_Revenue_Loss',
      'Export Revenue Loss USD'
    ]);
    const numLoss = parseFloat(loss) || 0;
    
    if (!districtMap[district]) {
      districtMap[district] = 0;
    }
    districtMap[district] += isNaN(numLoss) ? 0 : numLoss;
  });

  return Object.entries(districtMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const processLocalLossByNature = (data) => {
  const natureMap = {};
  
  data.forEach(row => {
    const nature = findColumn(row, [
      'Nature of Business',
      'Business Nature',
      'Business Type',
      'Type of Business',
      'Nature of Business',
      'BusinessNature',
      'Business_Type'
    ]) || 'Unknown';
    const loss = findColumn(row, [
      'Local Revenue Loss (LKR)',
      'Local Loss',
      'Local Loss (USD)',
      'Local loss',
      'Local Revenue Loss',
      'Local Revenue Loss (USD)',
      'Local Loss (LKR)',
      'Local Revenue Loss LKR',
      'LocalLoss',
      'Local_Revenue_Loss',
      'Local Revenue Loss LKR'
    ]);
    const numLoss = parseFloat(loss) || 0;
    
    if (!natureMap[nature]) {
      natureMap[nature] = 0;
    }
    natureMap[nature] += isNaN(numLoss) ? 0 : numLoss;
  });

  const total = Object.values(natureMap).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(natureMap).map(([name, value]) => ({
    name,
    value,
    percentage: total > 0 ? (value / total * 100).toFixed(2) : 0
  }));
};

const processLocalLossByScale = (data) => {
  const scaleMap = {};
  
  data.forEach(row => {
    const scale = findColumn(row, [
      'Industry Scale',
      'Scale',
      'Business Scale',
      'IndustryScale',
      'Business_Scale',
      'Size'
    ]) || 'Unknown';
    const loss = findColumn(row, [
      'Local Revenue Loss (LKR)',
      'Local Loss',
      'Local Loss (USD)',
      'Local loss',
      'Local Revenue Loss',
      'Local Revenue Loss (USD)',
      'Local Loss (LKR)',
      'Local Revenue Loss LKR',
      'LocalLoss',
      'Local_Revenue_Loss',
      'Local Revenue Loss LKR'
    ]);
    const numLoss = parseFloat(loss) || 0;
    
    if (!scaleMap[scale]) {
      scaleMap[scale] = 0;
    }
    scaleMap[scale] += isNaN(numLoss) ? 0 : numLoss;
  });

  return Object.entries(scaleMap).map(([name, value]) => ({ name, value }));
};

const processBusinessesByImpact = (data) => {
  const impactMap = {};
  
  data.forEach(row => {
    const impact = findColumn(row, ['Nature of Impact', 'Impact', 'Damage Level']) || 'Unknown';
    impactMap[impact] = (impactMap[impact] || 0) + 1;
  });

  return Object.entries(impactMap).map(([name, value]) => ({ name, value }));
};

const processBusinessesByRestartDate = (data) => {
  const dateMap = {};
  
  data.forEach(row => {
    let date = findColumn(row, ['Possible Restart Date', 'Restart Date', 'Restart Date Expected']);
    
    if (date) {
      // Handle Excel date serial numbers or date strings
      if (typeof date === 'number') {
        // Excel serial date (days since 1900-01-01)
        const excelEpoch = new Date(1899, 11, 30);
        date = new Date(excelEpoch.getTime() + date * 86400000);
      } else if (typeof date === 'string') {
        // Try parsing as date string
        date = new Date(date);
      }
      
      if (date instanceof Date && !isNaN(date.getTime())) {
        const dateKey = date.toISOString().split('T')[0];
        dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
      }
    }
  });

  return Object.entries(dateMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const processBusinessesByMarketType = (data) => {
  const marketMap = {};
  
  data.forEach(row => {
    const marketType = findColumn(row, ['Market Types', 'Market Type', 'Market', 'Market Category']) || 'Unknown';
    marketMap[marketType] = (marketMap[marketType] || 0) + 1;
  });

  const total = Object.values(marketMap).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(marketMap).map(([name, value]) => ({
    name,
    value,
    percentage: total > 0 ? (value / total * 100).toFixed(1) : 0
  }));
};


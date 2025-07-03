import axios from 'axios';

// Configure axios
const api = axios.create({
  baseURL: 'http://localhost:5001',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  checkHealth: async () => {
    const response = await api.get('/api/health');
    return response.data;
  }
};

// User API functions
export const userAPI = {
  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  }
};

// Database API functions
export const databaseAPI = {
  getStatus: async () => {
    const response = await api.get('/api/database/status');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/api/database/dashboard');
    return response.data;
  },

  getTablespace: async () => {
    const response = await api.get('/api/database/tablespace');
    return response.data;
  },

  getInfo: async () => {
    const response = await api.get('/api/database/info');
    return response.data;
  },

  // Configuration functions
  getConfig: async () => {
    const response = await api.get('/api/database/config');
    return response.data;
  },

  saveConfig: async (configData) => {
    const response = await api.post('/api/database/config', configData);
    return response.data;
  },

  testConnection: async (connectionData) => {
    const response = await api.post('/api/database/test-connection', connectionData);
    return response.data;
  }
};

// NEW: Monitoring API functions
export const monitoringAPI = {
  getStatus: async () => {
    const response = await api.get('/api/monitoring/status');
    return response.data;
  },

  start: async () => {
    const response = await api.post('/api/monitoring/start');
    return response.data;
  },

  stop: async () => {
    const response = await api.post('/api/monitoring/stop');
    return response.data;
  },

  forceCheck: async () => {
    const response = await api.post('/api/monitoring/force-check');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/api/monitoring/history');
    return response.data;
  }
};

// NEW: Logs API functions
export const logsAPI = {
  getDowntimeLogs: async () => {
    const response = await api.get('/api/logs/downtime');
    return response.data;
  }
};

// System monitoring API
export const systemAPI = {
  getMetrics: async () => {
    const response = await api.get('/api/system/metrics');
    return response.data;
  }
};

// NEW: Email API functions
export const emailAPI = {
  getEmailList: async () => {
    const response = await api.get('/api/email/list');
    return response.data;
  },

  updateEmailList: async (emails) => {
    const response = await api.post('/api/email/list', { emails });
    return response.data;
  },

  sendTestEmail: async () => {
    const response = await api.post('/api/email/test');
    return response.data;
  },

  getEmailConfig: async () => {
    const response = await api.get('/api/email/config');
    return response.data;
  },

  saveEmailConfig: async (configData) => {
    const response = await api.post('/api/email/config', configData);
    return response.data;
  },

  testConfiguration: async () => {
    const response = await api.get('/api/email/config/test');
    return response.data;
  },

  // Add to emailAPI:
getEmailGroups: async () => {
  const response = await api.get('/api/email/groups');
  return response.data;
},

createEmailGroup: async (groupData) => {
  const response = await api.post('/api/email/groups', groupData);
  return response.data;
},

updateEmailGroup: async (id, groupData) => {
  const response = await api.put(`/api/email/groups/${id}`, groupData);
  return response.data;
},

deleteEmailGroup: async (id) => {
  const response = await api.delete(`/api/email/groups/${id}`);
  return response.data;
},
};

// Add to your existing API exports:
export const urlAPI = {
  getAllUrls: async () => {
    const response = await api.get('/api/urls');
    return response.data;
  },

  addUrl: async (urlData) => {
    const response = await api.post('/api/urls', urlData);
    return response.data;
  },

  updateUrl: async (id, urlData) => {
    const response = await api.put(`/api/urls/${id}`, urlData);
    return response.data;
  },

  deleteUrl: async (id) => {
    const response = await api.delete(`/api/urls/${id}`);
    return response.data;
  },

  getUrlStatuses: async () => {
    const response = await api.get('/api/urls/statuses');
    return response.data;
  },

  getUrlStats: async () => {
    const response = await api.get('/api/urls/stats');
    return response.data;
  },

  checkUrl: async (id) => {
    const response = await api.post(`/api/urls/check/${id}`);
    return response.data;
  }
};

// Add this export with your other APIs
export const kubernetesAPI = {
  getPods: async (namespace = 'default') => {
    const response = await api.get(`/api/kubernetes/pods?namespace=${namespace}`);
    return response.data;
  },

  getAllPods: async () => {
    const response = await api.get('/api/kubernetes/pods/all');
    return response.data;
  },

  getNamespaces: async () => {
    const response = await api.get('/api/kubernetes/namespaces');
    return response.data;
  },

  getNodes: async () => {
    const response = await api.get('/api/kubernetes/nodes');
    return response.data;
  },

  getClusterInfo: async () => {
    const response = await api.get('/api/kubernetes/cluster-info');
    return response.data;
  },
   getConfig: async () => {
    const response = await api.get('/api/kubernetes/config');
    return response.data;
  },

  saveConfig: async (configData) => {
    const response = await api.post('/api/kubernetes/config', configData);
    return response.data;
  },

  testConfig: async (configData) => {
    const response = await api.post('/api/kubernetes/config/test', configData);
    return response.data;
  },
};

export const thresholdAPI = {
  getDbSizeThreshold: async () => {
    const response = await api.get('/api/thresholds/db-size');
    return response.data;
  },

  saveDbSizeThreshold: async (settings) => {
    const response = await api.post('/api/thresholds/db-size', settings);
    return response.data;
  }
};



// Script API functions 
export const scriptAPI = {
  getAllScripts: async () => {
    try {
      console.log('🔍 Fetching all scripts...');
      const response = await api.get('/api/scripts');
      console.log('✅ Scripts loaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load scripts:', error);
      throw new Error(`Failed to load scripts: ${error.response?.data?.error || error.message}`);
    }
  },

  addScript: async (scriptData) => {
    try {
      console.log('📝 Adding script:', scriptData);
      const response = await api.post('/api/scripts', scriptData);
      console.log('✅ Script added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to add script:', error);
      throw new Error(`Failed to add script: ${error.response?.data?.error || error.message}`);
    }
  },

  updateScript: async (id, scriptData) => {
    try {
      console.log('🔄 Updating script:', id, scriptData);
      const response = await api.put(`/api/scripts/${id}`, scriptData);
      console.log('✅ Script updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update script:', error);
      throw new Error(`Failed to update script: ${error.response?.data?.error || error.message}`);
    }
  },

  deleteScript: async (id) => {
    try {
      console.log('🗑️ Deleting script:', id);
      const response = await api.delete(`/api/scripts/${id}`);
      console.log('✅ Script deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to delete script:', error);
      throw new Error(`Failed to delete script: ${error.response?.data?.error || error.message}`);
    }
  },

  // ENHANCED RUN SCRIPT WITH BETTER ERROR HANDLING
  runScript: async (id) => {
    try {
      console.log('🏃 Running script with ID:', id);
      console.log('⏰ Starting script execution at:', new Date().toISOString());
      
      // Increased timeout for script execution (10 minutes)
      const response = await api.post(`/api/scripts/${id}/run`, {}, {
        timeout: 600000, // 10 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Script execution completed:', response.data);
      console.log('⏰ Completed at:', new Date().toISOString());
      
      return response.data;
    } catch (error) {
      console.error('❌ Script execution failed:', error);
      
      // Better error handling for different types of network errors
      if (error.code === 'ECONNABORTED') {
        throw new Error('Script execution timed out. The script may be taking longer than expected.');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else if (error.code === 'ENETUNREACH') {
        throw new Error('Network unreachable. Please check your connection.');
      } else if (error.response?.status === 500) {
        throw new Error(`Server error: ${error.response?.data?.error || 'Internal server error'}`);
      } else if (error.response?.status === 400) {
        throw new Error(`Script error: ${error.response?.data?.error || 'Bad request'}`);
      } else if (error.response?.status === 404) {
        throw new Error('Script not found. Please refresh and try again.');
      } else {
        throw new Error(`Network error: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      }
    }
  },

  getScriptHistory: async (id) => {
    try {
      console.log('📊 Getting script history for ID:', id);
      const response = await api.get(`/api/scripts/${id}/history`);
      console.log('✅ Script history loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get script history:', error);
      throw new Error(`Failed to get script history: ${error.response?.data?.error || error.message}`);
    }
  },

  validatePath: async (data) => {
    try {
      console.log('🔍 Validating script path:', data.scriptPath);
      const response = await api.post('/api/scripts/validate-path', data);
      console.log('✅ Path validation result:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to validate path:', error);
      return { valid: false, error: 'Failed to validate path' };
    }
  },

  // NEW: Test connection to backend
  testConnection: async () => {
    try {
      console.log('🔗 Testing backend connection...');
      const response = await api.get('/api/health');
      console.log('✅ Backend connection successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return { success: false, error: error.message };
    }
  }
};
export default api;
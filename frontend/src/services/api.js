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
    const response = await api.get('/api/scripts');
    return response.data;
  },

  addScript: async (scriptData) => {
    const response = await api.post('/api/scripts', scriptData);
    return response.data;
  },

  updateScript: async (id, scriptData) => {
    const response = await api.put(`/api/scripts/${id}`, scriptData);
    return response.data;
  },

  deleteScript: async (id) => {
    const response = await api.delete(`/api/scripts/${id}`);
    return response.data;
  },

  runScript: async (id) => {
    const response = await api.post(`/api/scripts/${id}/run`);
    return response.data;
  },

  getScriptHistory: async (id) => {
    const response = await api.get(`/api/scripts/${id}/history`);
    return response.data;
  },

  validateScriptPath: async (scriptPath) => {
    const response = await api.post('/api/scripts/validate-path', { scriptPath });
    return response.data;
  }
};
export default api;
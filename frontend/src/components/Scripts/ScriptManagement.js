// Improved Script Management Frontend Component
// File: frontend/src/components/Scripts/ImprovedScriptManagement.js

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  message,
  Popconfirm,
  Tag,
  Modal,
  Input,
  Alert,
  Tooltip,
  Select,
  Divider,
  Row,
  Col,
  AutoComplete
} from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  FileTextOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { scriptAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ImprovedScriptManagement = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runningScripts, setRunningScripts] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [outputModal, setOutputModal] = useState({ visible: false, script: null, output: '', loading: false });
  const [pathValidation, setPathValidation] = useState({ status: '', message: '' });
  const [form, setForm] = useState({
    name: '',
    description: '',
    scriptPath: '',
    arguments: ''
  });

  // Common script suggestions
  const scriptSuggestions = [
    { label: 'System Info (Windows)', value: 'systeminfo', description: 'Display system information' },
    { label: 'Directory List (Windows)', value: 'dir /w', description: 'List directory contents' },
    { label: 'Network Config (Windows)', value: 'ipconfig /all', description: 'Show network configuration' },
    { label: 'Active Connections (Windows)', value: 'netstat -an', description: 'Show network connections' },
    { label: 'Running Processes (Windows)', value: 'tasklist', description: 'List running processes' },
    { label: 'Ping Test (Windows)', value: 'ping google.com', description: 'Test network connectivity' },
    { label: 'PowerShell Script', value: 'powershell.exe -File "C:\\Scripts\\script.ps1"', description: 'Run PowerShell script' },
    { label: 'Batch File', value: 'C:\\Scripts\\backup.bat', description: 'Run batch file' },
    { label: 'System Info (Linux)', value: 'uname -a', description: 'Display system information' },
    { label: 'Directory List (Linux)', value: 'ls -la', description: 'List directory contents' },
    { label: 'Disk Usage (Linux)', value: 'df -h', description: 'Show disk space usage' },
    { label: 'Memory Usage (Linux)', value: 'free -h', description: 'Show memory usage' },
    { label: 'Running Processes (Linux)', value: 'ps aux', description: 'List running processes' }
  ];

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const response = await scriptAPI.getAllScripts();
      if (response.success) {
        setScripts(response.data);
      }
    } catch (error) {
      console.error('Failed to load scripts:', error);
      message.error('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const validateScriptPath = async (path) => {
    if (!path || path.trim() === '') {
      setPathValidation({ status: '', message: '' });
      return;
    }

    try {
      const response = await scriptAPI.validatePath({ scriptPath: path });
      if (response.valid) {
        setPathValidation({ 
          status: 'success', 
          message: response.message || 'Path is valid' 
        });
      } else {
        setPathValidation({ 
          status: 'error', 
          message: response.error || 'Path validation failed' 
        });
      }
    } catch (error) {
      setPathValidation({ 
        status: 'error', 
        message: 'Failed to validate path' 
      });
    }
  };

  const handleRunScript = async (script) => {
    try {
      setRunningScripts(prev => new Set([...prev, script.id]));
      setOutputModal({ visible: true, script, output: '', loading: true });
      
      const response = await scriptAPI.runScript(script.id);
      
      if (response.success) {
        setOutputModal(prev => ({
          ...prev,
          output: response.output,
          loading: false
        }));
        message.success('Script executed successfully');
        loadScripts(); // Refresh to update last run status
      } else {
        setOutputModal(prev => ({
          ...prev,
          output: response.error || 'Script execution failed',
          loading: false
        }));
        message.error('Script execution failed');
      }
    } catch (error) {
      console.error('Failed to run script:', error);
      setOutputModal(prev => ({
        ...prev,
        output: error.message || 'Script execution failed',
        loading: false
      }));
      message.error('Failed to run script');
    } finally {
      setRunningScripts(prev => {
        const newSet = new Set(prev);
        newSet.delete(script.id);
        return newSet;
      });
    }
  };

  const handleAddScript = () => {
    setEditingScript(null);
    setForm({
      name: '',
      description: '',
      scriptPath: '',
      arguments: ''
    });
    setPathValidation({ status: '', message: '' });
    setModalVisible(true);
  };

  const handleEditScript = (script) => {
    setEditingScript(script);
    setForm({
      name: script.name,
      description: script.description || '',
      scriptPath: script.scriptPath,
      arguments: script.arguments || ''
    });
    setPathValidation({ status: '', message: '' });
    setModalVisible(true);
  };

  const handleDeleteScript = async (scriptId) => {
    try {
      const response = await scriptAPI.deleteScript(scriptId);
      if (response.success) {
        message.success('Script deleted successfully');
        loadScripts();
      }
    } catch (error) {
      message.error('Failed to delete script');
    }
  };

  const handleSaveScript = async () => {
    try {
      if (!form.name || !form.scriptPath) {
        message.error('Please fill in required fields');
        return;
      }

      if (pathValidation.status === 'error') {
        message.error('Please fix the script path before saving');
        return;
      }

      let response;
      if (editingScript) {
        response = await scriptAPI.updateScript(editingScript.id, form);
      } else {
        response = await scriptAPI.addScript(form);
      }

      if (response.success) {
        message.success(editingScript ? 'Script updated successfully' : 'Script added successfully');
        setModalVisible(false);
        loadScripts();
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to save script');
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate path when it changes
    if (field === 'scriptPath') {
      const timeoutId = setTimeout(() => {
        validateScriptPath(value);
      }, 500); // Debounce validation
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const selected = scriptSuggestions.find(s => s.value === suggestion);
    if (selected) {
      setForm(prev => ({
        ...prev,
        scriptPath: selected.value,
        name: prev.name || selected.label,
        description: prev.description || selected.description
      }));
      validateScriptPath(selected.value);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const getStatusColor = (lastStatus) => {
    switch (lastStatus) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'default';
    }
  };

  const getStatusIcon = (lastStatus) => {
    switch (lastStatus) {
      case 'success': return <CheckCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      case 'running': return <ClockCircleOutlined />;
      default: return null;
    }
  };

  const columns = [
    {
      title: 'Script Details',
      key: 'details',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Tooltip title="Click to copy path">
              <Text 
                type="secondary" 
                style={{ fontSize: '12px', cursor: 'pointer' }}
                onClick={() => copyToClipboard(record.scriptPath)}
              >
                <FileTextOutlined /> {record.scriptPath}
                <CopyOutlined style={{ marginLeft: 4, fontSize: '10px' }} />
              </Text>
            </Tooltip>
          </div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Arguments',
      dataIndex: 'arguments',
      key: 'arguments',
      render: (args) => (
        args ? (
          <Tooltip title={args}>
            <Text code style={{ fontSize: '12px' }}>
              {args.length > 30 ? `${args.substring(0, 30)}...` : args}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>None</Text>
        )
      ),
    },
    {
      title: 'Last Status',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag 
            color={getStatusColor(record.lastStatus)} 
            icon={getStatusIcon(record.lastStatus)}
          >
            {record.lastStatus || 'Never Run'}
          </Tag>
          {record.lastRunAt && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {new Date(record.lastRunAt).toLocaleString()}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Run Script">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              loading={runningScripts.has(record.id)}
              onClick={() => handleRunScript(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Script">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditScript(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Script">
            <Popconfirm
              title="Delete Script"
              description="Are you sure you want to delete this script?"
              onConfirm={() => handleDeleteScript(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <CodeOutlined />
            <Title level={4} style={{ margin: 0 }}>Script Management</Title>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadScripts}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddScript}
            >
              Add Script
            </Button>
          </Space>
        }
      >
        <Alert
          message="Script Execution Information"
          description="Scripts run on the server where the backend is hosted. Ensure all paths are accessible from the server."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={scripts}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          locale={{
            emptyText: 'No scripts configured'
          }}
        />
      </Card>

      {/* Enhanced Add/Edit Script Modal */}
      <Modal
        title={
          <Space>
            {editingScript ? <EditOutlined /> : <PlusOutlined />}
            {editingScript ? 'Edit Script' : 'Add New Script'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveScript}
        width={800}
        okText={editingScript ? 'Update Script' : 'Add Script'}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Quick Suggestions */}
          <div>
            <Text strong>
              <BulbOutlined /> Quick Suggestions
              <Tooltip title="Select a common script to auto-fill the form">
                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </Text>
            <Select
              placeholder="Select a common script template"
              style={{ width: '100%', marginTop: 4 }}
              onSelect={handleSuggestionSelect}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {scriptSuggestions.map((suggestion, index) => (
                <Option key={index} value={suggestion.value}>
                  {suggestion.label}
                </Option>
              ))}
            </Select>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* Script Name */}
          <div>
            <Text strong>Script Name *</Text>
            <Input
              placeholder="e.g., Database Backup, System Cleanup, Health Check"
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Description */}
          <div>
            <Text strong>Description</Text>
            <TextArea
              placeholder="Brief description of what this script does..."
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={2}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Script Path with Enhanced Validation */}
          <div>
            <Text strong>Script Path *</Text>
            <Row gutter={8} style={{ marginTop: 4 }}>
              <Col flex="auto">
                <Input
                  placeholder="Full path to script or system command (e.g., C:\scripts\backup.bat or systeminfo)"
                  value={form.scriptPath}
                  onChange={(e) => handleFormChange('scriptPath', e.target.value)}
                  prefix={<FileTextOutlined />}
                  status={pathValidation.status === 'error' ? 'error' : ''}
                />
              </Col>
              <Col>
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={() => document.getElementById('script-file-input').click()}
                  title="Browse for script file"
                >
                  Browse
                </Button>
                <input
                  type="file"
                  accept=".bat,.cmd,.ps1,.exe,.com,.sh"
                  style={{ display: 'none' }}
                  id="script-file-input"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // For web browsers, we can only get the filename, not the full path
                      // So we'll help the user by showing them what to do
                      const fileName = file.name;
                      message.info({
                        content: (
                          <div>
                            <div><strong>File selected:</strong> {fileName}</div>
                            <div style={{ marginTop: 8, fontSize: '12px' }}>
                              Please type the full server path to this file in the input field above.
                              <br />
                              Example: <code>C:\Scripts\{fileName}</code>
                            </div>
                          </div>
                        ),
                        duration: 8
                      });
                      
                      // If the current path is empty, suggest a common path structure
                      if (!form.scriptPath) {
                        const isWindows = fileName.match(/\.(bat|cmd|ps1|exe|com)$/i);
                        const suggestedPath = isWindows 
                          ? `C:\\Scripts\\${fileName}`
                          : `/home/user/scripts/${fileName}`;
                        
                        setForm(prev => ({
                          ...prev,
                          scriptPath: suggestedPath
                        }));
                        
                        // Validate the suggested path
                        setTimeout(() => {
                          validateScriptPath(suggestedPath);
                        }, 100);
                      }
                    }
                    // Clear the input so the same file can be selected again
                    e.target.value = '';
                  }}
                />
              </Col>
            </Row>
            
            {/* Path Validation Feedback */}
            {pathValidation.status && (
              <div style={{ marginTop: 4 }}>
                <Text 
                  type={pathValidation.status === 'success' ? 'success' : 'danger'}
                  style={{ fontSize: '12px' }}
                >
                  {pathValidation.status === 'success' ? '✅ ' : '❌ '}
                  {pathValidation.message}
                </Text>
              </div>
            )}
            
            <div style={{ marginTop: 8 }}>
              <Alert
                message="Path Examples:"
                description={
                  <div>
                    <Text strong>Windows:</Text>
                    <br />
                    • System commands: <Text code>systeminfo</Text>, <Text code>dir</Text>, <Text code>ipconfig /all</Text>
                    <br />
                    • Batch files: <Text code>C:\Scripts\backup.bat</Text>
                    <br />
                    • PowerShell: <Text code>powershell.exe -File "C:\Scripts\script.ps1"</Text>
                    <br />
                    • Executables: <Text code>C:\Program Files\MyApp\app.exe</Text>
                    <br /><br />
                    <Text strong>Linux/macOS:</Text>
                    <br />
                    • System commands: <Text code>ls -la</Text>, <Text code>ps aux</Text>, <Text code>df -h</Text>
                    <br />
                    • Scripts: <Text code>/home/user/scripts/backup.sh</Text>
                    <br />
                    • Binaries: <Text code>/usr/local/bin/myapp</Text>
                  </div>
                }
                type="info"
                showIcon={false}
                style={{ fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Arguments */}
          <div>
            <Text strong>Arguments (Optional)</Text>
            <Input
              placeholder="Command line arguments (e.g., --verbose --output=log.txt)"
              value={form.arguments}
              onChange={(e) => handleFormChange('arguments', e.target.value)}
              style={{ marginTop: 4 }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              These arguments will be passed to your script when executed
            </Text>
          </div>

          {/* Security Warning */}
          <Alert
            message="Security & Execution Notes"
            description={
              <div>
                • Scripts run with the permissions of the Node.js server process
                <br />
                • Ensure all scripts are trusted and from reliable sources
                <br />
                • Test scripts manually before adding them to the system
                <br />
                • Avoid scripts that require user interaction or GUI elements
                <br />
                • Scripts have a 5-minute timeout limit
              </div>
            }
            type="warning"
            showIcon
          />
        </Space>
      </Modal>

      {/* Enhanced Script Output Modal */}
      <Modal
        title={
          <Space>
            <CodeOutlined />
            Script Output: {outputModal.script?.name}
            <Tag color={outputModal.loading ? 'blue' : 'default'}>
              {outputModal.loading ? 'Running...' : 'Completed'}
            </Tag>
          </Space>
        }
        open={outputModal.visible}
        onCancel={() => setOutputModal({ visible: false, script: null, output: '', loading: false })}
        footer={[
          <Button 
            key="copy" 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(outputModal.output)}
            disabled={!outputModal.output}
          >
            Copy Output
          </Button>,
          <Button 
            key="close" 
            type="primary"
            onClick={() => setOutputModal({ visible: false, script: null, output: '', loading: false })}
          >
            Close
          </Button>
        ]}
        width={900}
      >
        {/* Script Information */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Script Path:</Text>
              <br />
              <Text code style={{ fontSize: '12px' }}>{outputModal.script?.scriptPath}</Text>
            </Col>
            <Col span={12}>
              {outputModal.script?.arguments && (
                <>
                  <Text strong>Arguments:</Text>
                  <br />
                  <Text code style={{ fontSize: '12px' }}>{outputModal.script.arguments}</Text>
                </>
              )}
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Output Display */}
        <div>
          <Text strong>Execution Output:</Text>
          <div style={{
            background: '#000',
            color: '#00ff00',
            padding: '16px',
            borderRadius: '6px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13px',
            maxHeight: '500px',
            overflow: 'auto',
            marginTop: '8px',
            whiteSpace: 'pre-wrap',
            border: '1px solid #333'
          }}>
            {outputModal.loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text style={{ color: '#00ff00' }}>
                  ⏳ Executing script... Please wait...
                  <br />
                  <br />
                  This may take up to 5 minutes depending on the script.
                </Text>
              </div>
            ) : (
              <div>
                {outputModal.output || 'No output generated'}
                <br />
                <br />
                <Text style={{ color: '#888', fontSize: '11px' }}>
                  --- End of Output ---
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Execution Tips */}
        {outputModal.loading && (
          <Alert
            message="Script is running..."
            description="The script is being executed on the server. You can close this window and check back later."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ImprovedScriptManagement;
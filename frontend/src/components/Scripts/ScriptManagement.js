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
  Upload,
  Alert,
  Tooltip
} from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  FileTextOutlined,
  UploadOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { scriptAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ScriptManagement = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runningScripts, setRunningScripts] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [outputModal, setOutputModal] = useState({ visible: false, script: null, output: '', loading: false });
  const [form, setForm] = useState({
    name: '',
    description: '',
    scriptPath: '',
    arguments: ''
  });

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
      message.error('Failed to save script');
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (lastStatus) => {
    switch (lastStatus) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'default';
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
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <FileTextOutlined /> {record.scriptPath}
            </Text>
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
          <Text type="secondary">None</Text>
        )
      ),
    },
    {
      title: 'Last Run',
      key: 'lastRun',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.lastRunAt ? (
            <Text style={{ fontSize: '12px' }}>
              <ClockCircleOutlined /> {new Date(record.lastRunAt).toLocaleString()}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>Never run</Text>
          )}
          {record.lastStatus && (
            <Tag color={getStatusColor(record.lastStatus)}>
              {record.lastStatus.toUpperCase()}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            icon={<PlayCircleOutlined />} 
            onClick={() => handleRunScript(record)}
            loading={runningScripts.has(record.id)}
            size="small"
          >
            Run
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditScript(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this script?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteScript(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Main Table */}
      <Card
        title={
          <Space>
            <CodeOutlined />
            Windows Script Management
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
          message="Windows Script Execution"
          description="Add and run Windows batch files (.bat), PowerShell scripts (.ps1), or executables (.exe). Scripts run on the server where the backend is hosted."
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

      {/* Add/Edit Script Modal */}
      <Modal
        title={editingScript ? 'Edit Script' : 'Add New Script'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveScript}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Script Name *</Text>
            <Input
              placeholder="e.g., Database Backup, System Cleanup"
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>

          <div>
            <Text strong>Description</Text>
            <TextArea
              placeholder="Brief description of what this script does"
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={2}
              style={{ marginTop: 4 }}
            />
          </div>

          <div>
            <Text strong>Script Path *</Text>
            <Space.Compact style={{ display: 'flex', marginTop: 4 }}>
              <Input
                placeholder="C:\scripts\backup.bat or C:\tools\app.exe"
                value={form.scriptPath}
                onChange={(e) => handleFormChange('scriptPath', e.target.value)}
                style={{ flex: 1 }}
                prefix={<FileTextOutlined />}
              />
              <input
                type="file"
                accept=".bat,.cmd,.ps1,.exe,.com"
                style={{ display: 'none' }}
                ref={(input) => {
                  if (input) {
                    input.addEventListener('change', (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFormChange('scriptPath', file.path || file.name);
                      }
                    });
                  }
                }}
                id="script-file-input"
              />
              <Button
                icon={<FolderOpenOutlined />}
                onClick={() => document.getElementById('script-file-input').click()}
                title="Browse for script file"
              >
                Browse
              </Button>
            </Space.Compact>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Full path to your script file (.bat, .ps1, .exe, etc.) or click Browse to select
            </Text>
          </div>

          <div>
            <Text strong>Arguments (Optional)</Text>
            <Input
              placeholder="--verbose --output=log.txt"
              value={form.arguments}
              onChange={(e) => handleFormChange('arguments', e.target.value)}
              style={{ marginTop: 4 }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Command line arguments to pass to the script
            </Text>
          </div>

          <Alert
            message="Security Note"
            description="Scripts will run with the permissions of the Node.js process. Ensure your scripts are trusted and secure."
            type="warning"
            showIcon
          />
        </Space>
      </Modal>

      {/* Script Output Modal */}
      <Modal
        title={
          <Space>
            <CodeOutlined />
            Script Output: {outputModal.script?.name}
          </Space>
        }
        open={outputModal.visible}
        onCancel={() => setOutputModal({ visible: false, script: null, output: '', loading: false })}
        footer={[
          <Button key="close" onClick={() => setOutputModal({ visible: false, script: null, output: '', loading: false })}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Script Path:</Text> <Text code>{outputModal.script?.scriptPath}</Text>
          {outputModal.script?.arguments && (
            <div>
              <Text strong>Arguments:</Text> <Text code>{outputModal.script.arguments}</Text>
            </div>
          )}
        </div>

        <div>
          <Text strong>Output:</Text>
          <div style={{
            background: '#000',
            color: '#fff',
            padding: '12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '400px',
            overflow: 'auto',
            marginTop: '8px',
            whiteSpace: 'pre-wrap'
          }}>
            {outputModal.loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text style={{ color: '#fff' }}>Running script...</Text>
              </div>
            ) : (
              outputModal.output || 'No output'
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScriptManagement;
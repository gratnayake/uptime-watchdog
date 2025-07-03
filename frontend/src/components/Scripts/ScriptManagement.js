// frontend/src/components/Scripts/ScriptManagement.js - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Input,
  Space,
  Typography,
  Alert,
  Tag,
  Tooltip,
  Select,
  Divider,
  notification
} from 'antd';
import {
  PlayCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ScriptManagement = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    scriptPath: '',
    arguments: '',
    type: 'system'
  });
  const [outputModal, setOutputModal] = useState({
    visible: false,
    script: null,
    output: '',
    loading: false
  });

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/scripts');
      if (response.data.success) {
        setScripts(response.data.data);
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch scripts'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveScript = async () => {
    if (!form.name || !form.scriptPath) {
      notification.error({
        message: 'Validation Error',
        description: 'Name and script path are required'
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = editingScript ? `/api/scripts/${editingScript.id}` : '/api/scripts';
      const method = editingScript ? 'put' : 'post';

      const response = await axios[method](endpoint, {
        name: form.name,
        description: form.description,
        scriptPath: form.scriptPath,
        arguments: form.arguments,
        type: form.type
      });

      if (response.data.success) {
        notification.success({
          message: 'Success',
          description: `Script ${editingScript ? 'updated' : 'created'} successfully`
        });
        setModalVisible(false);
        resetForm();
        fetchScripts();
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.error || 'Failed to save script'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunScript = async (script) => {
    setOutputModal({
      visible: true,
      script: script,
      output: '',
      loading: true
    });

    try {
      const response = await axios.post(`/api/scripts/${script.id}/run`);
      
      setOutputModal(prev => ({
        ...prev,
        output: response.data.output || 'Script completed successfully',
        loading: false
      }));

      if (response.data.success) {
        notification.success({
          message: 'Script Executed',
          description: `${script.name} completed successfully`
        });
      } else {
        notification.warning({
          message: 'Script Completed with Issues',
          description: `${script.name} completed but may have encountered issues`
        });
      }

      // Refresh scripts to update status
      fetchScripts();

    } catch (error) {
      setOutputModal(prev => ({
        ...prev,
        output: error.response?.data?.output || error.message || 'Script execution failed',
        loading: false
      }));

      notification.error({
        message: 'Execution Error',
        description: `Failed to execute ${script.name}`
      });
    }
  };

  const handleEditScript = (script) => {
    setEditingScript(script);
    setForm({
      name: script.name,
      description: script.description || '',
      scriptPath: script.scriptPath,
      arguments: script.arguments || '',
      type: script.type || 'system'
    });
    setModalVisible(true);
  };

  const handleDeleteScript = async (scriptId) => {
    Modal.confirm({
      title: 'Delete Script',
      content: 'Are you sure you want to delete this script?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/scripts/${scriptId}`);
          if (response.data.success) {
            notification.success({
              message: 'Success',
              description: 'Script deleted successfully'
            });
            fetchScripts();
          }
        } catch (error) {
          notification.error({
            message: 'Error',
            description: 'Failed to delete script'
          });
        }
      }
    });
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      scriptPath: '',
      arguments: '',
      type: 'system'
    });
    setEditingScript(null);
  };

  const getScriptTypeIcon = (type) => {
    switch (type) {
      case 'database':
        return <DatabaseOutlined style={{ color: '#1890ff' }} />;
      case 'system':
        return <DesktopOutlined style={{ color: '#52c41a' }} />;
      default:
        return <CodeOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getScriptTypeColor = (type) => {
    switch (type) {
      case 'database':
        return 'blue';
      case 'system':
        return 'green';
      default:
        return 'orange';
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'success':
        return <Tag color="success">Success</Tag>;
      case 'failed':
        return <Tag color="error">Failed</Tag>;
      case 'running':
        return <Tag color="processing">Running</Tag>;
      default:
        return <Tag color="default">Not Run</Tag>;
    }
  };

  const isDatabaseScript = (scriptPath) => {
    return scriptPath === 'ORACLE_DB_SHUTDOWN' || scriptPath === 'ORACLE_DB_STARTUP';
  };

  const getScriptDescription = (script) => {
    if (script.scriptPath === 'ORACLE_DB_SHUTDOWN') {
      return `Oracle Database Shutdown (${script.arguments || 'immediate'} mode)`;
    }
    if (script.scriptPath === 'ORACLE_DB_STARTUP') {
      return `Oracle Database Startup (${script.arguments || 'open'} mode)`;
    }
    return script.description || 'No description';
  };

  const columns = [
    {
      title: 'Script',
      key: 'script',
      render: (_, record) => (
        <Space>
          {getScriptTypeIcon(record.type)}
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getScriptDescription(record)}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={getScriptTypeColor(type)}>
          {type?.toUpperCase() || 'SYSTEM'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => getStatusTag(record.lastStatus),
    },
    {
      title: 'Last Run',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 180,
      render: (date) => 
        date ? new Date(date).toLocaleString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Run Script">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleRunScript(record)}
              loading={outputModal.loading && outputModal.script?.id === record.id}
            >
              Run
            </Button>
          </Tooltip>
          <Tooltip title="Edit Script">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditScript(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Script">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteScript(record.id)}
            />
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            Add Script
          </Button>
        }
      >
        <Alert
          message="Script Management Information"
          description="Manage system scripts and Oracle database operations. Database scripts use Oracle connections configured in Database Config. Scripts run on the server where the backend is hosted."
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
        onCancel={() => {
          setModalVisible(false);
          resetForm();
        }}
        onOk={handleSaveScript}
        width={700}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Script Type *</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={form.type}
              onChange={(value) => handleFormChange('type', value)}
            >
              <Option value="system">
                <Space>
                  <DesktopOutlined />
                  System Script
                </Space>
              </Option>
              <Option value="database">
                <Space>
                  <DatabaseOutlined />
                  Database Operation
                </Space>
              </Option>
            </Select>
          </div>

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

          {form.type === 'database' ? (
            <div>
              <Text strong>Database Operation *</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={form.scriptPath}
                onChange={(value) => handleFormChange('scriptPath', value)}
                placeholder="Select database operation"
              >
                <Option value="ORACLE_DB_SHUTDOWN">
                  <Space>
                    <DatabaseOutlined />
                    Oracle Database Shutdown
                  </Space>
                </Option>
                <Option value="ORACLE_DB_STARTUP">
                  <Space>
                    <DatabaseOutlined />
                    Oracle Database Startup
                  </Space>
                </Option>
              </Select>
            </div>
          ) : (
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
          )}

          <div>
            <Text strong>Arguments (Optional)</Text>
            {form.type === 'database' && form.scriptPath === 'ORACLE_DB_SHUTDOWN' ? (
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={form.arguments || 'immediate'}
                onChange={(value) => handleFormChange('arguments', value)}
                placeholder="Select shutdown mode"
              >
                <Option value="immediate">IMMEDIATE - Fast shutdown, rollback active transactions</Option>
                <Option value="normal">NORMAL - Wait for users to disconnect</Option>
                <Option value="abort">ABORT - Emergency shutdown (not recommended)</Option>
              </Select>
            ) : form.type === 'database' && form.scriptPath === 'ORACLE_DB_STARTUP' ? (
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={form.arguments || 'open'}
                onChange={(value) => handleFormChange('arguments', value)}
                placeholder="Select startup mode"
              >
                <Option value="open">OPEN - Full database startup (recommended)</Option>
                <Option value="mount">MOUNT - Mount database only</Option>
                <Option value="nomount">NOMOUNT - Start instance only</Option>
              </Select>
            ) : (
              <Input
                placeholder="--verbose --output=log.txt"
                value={form.arguments}
                onChange={(e) => handleFormChange('arguments', e.target.value)}
                style={{ marginTop: 4 }}
              />
            )}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {form.type === 'database' 
                ? 'Database operation mode/parameters'
                : 'Command line arguments to pass to the script'
              }
            </Text>
          </div>

          {form.type === 'database' && (
            <Alert
              message="Database Operations"
              description={
                <div>
                  <p><strong>Requirements:</strong></p>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Database must be configured in Database Config</li>
                    <li>User must have SYSDBA privileges</li>
                    <li>For shutdown: Database must be running</li>
                    <li>For startup: Database must be shutdown</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          )}

          {form.type === 'system' && (
            <Alert
              message="Security Note"
              description="Scripts will run with the permissions of the Node.js process. Ensure your scripts are trusted and secure."
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Modal>

      {/* Script Output Modal */}
      <Modal
        title={
          <Space>
            {outputModal.script?.type === 'database' ? <DatabaseOutlined /> : <CodeOutlined />}
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
        width={900}
      >
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Script:</Text> <Text code>{outputModal.script?.name}</Text>
            </div>
            {outputModal.script?.type === 'database' ? (
              <div>
                <Text strong>Operation:</Text> 
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {outputModal.script?.scriptPath?.replace('ORACLE_DB_', '')} {outputModal.script?.arguments}
                </Tag>
              </div>
            ) : (
              <>
                <div>
                  <Text strong>Path:</Text> <Text code>{outputModal.script?.scriptPath}</Text>
                </div>
                {outputModal.script?.arguments && (
                  <div>
                    <Text strong>Arguments:</Text> <Text code>{outputModal.script.arguments}</Text>
                  </div>
                )}
              </>
            )}
          </Space>
        </div>

        <Divider orientation="left">Output</Divider>
        <div style={{
          background: '#1f1f1f',
          color: '#fff',
          padding: '16px',
          borderRadius: '6px',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '13px',
          maxHeight: '400px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.4'
        }}>
          {outputModal.loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#52c41a' }}>
              <Text style={{ color: '#52c41a' }}>
                {outputModal.script?.type === 'database' 
                  ? 'Executing database operation...' 
                  : 'Running script...'
                }
              </Text>
            </div>
          ) : (
            outputModal.output || 'No output'
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ScriptManagement;
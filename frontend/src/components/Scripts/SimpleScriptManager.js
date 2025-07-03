// Simple Script Manager Component
// File: frontend/src/components/Scripts/SimpleScriptManager.js

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  message,
  Modal,
  Input,
  Alert,
  Table,
  Tag,
  Row,
  Col,
  Select,
  Tooltip
} from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  FileTextOutlined,
  CodeOutlined,
  FolderOpenOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SimpleScriptManager = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [outputModal, setOutputModal] = useState({ visible: false, script: null, output: '', loading: false });
  const [form, setForm] = useState({
    name: '',
    description: '',
    scriptPath: '',
    arguments: ''
  });

  // Predefined common arguments for MTCTL
  const commonArguments = [
    { label: 'Help', value: '--help', description: 'Show help information' },
    { label: 'Version', value: '--version', description: 'Show version information' },
    { label: 'Deploy Dev', value: 'deploy --env=dev', description: 'Deploy to development environment' },
    { label: 'Deploy Prod', value: 'deploy --env=prod', description: 'Deploy to production environment' },
    { label: 'Status Check', value: 'status --all', description: 'Check status of all components' },
    { label: 'List Services', value: 'list --services', description: 'List all available services' },
    { label: 'Config Validate', value: 'config --validate', description: 'Validate configuration' }
  ];

  useEffect(() => {
    loadScripts();
  }, []);

  // Load scripts from localStorage (simple storage)
  const loadScripts = () => {
    try {
      const saved = localStorage.getItem('simpleScripts');
      if (saved) {
        setScripts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load scripts:', error);
    }
  };

  // Save scripts to localStorage
  const saveScripts = (scriptList) => {
    try {
      localStorage.setItem('simpleScripts', JSON.stringify(scriptList));
      setScripts(scriptList);
    } catch (error) {
      console.error('Failed to save scripts:', error);
      message.error('Failed to save scripts');
    }
  };

  // Execute script using real backend API
  const executeScript = async (script) => {
    setOutputModal({ visible: true, script, output: '', loading: true });
    
    try {
      // Import the API (add this import at the top of the file)
      const { simpleScriptAPI } = await import('../../services/api');
      
      const result = await simpleScriptAPI.executeScript({
        name: script.name,
        scriptPath: script.scriptPath,
        arguments: script.arguments
      });
      
      setOutputModal(prev => ({
        ...prev,
        output: result.output,
        loading: false
      }));
      
      // Update last run time
      const updatedScripts = scripts.map(s => 
        s.id === script.id 
          ? { ...s, lastRun: new Date().toISOString() }
          : s
      );
      saveScripts(updatedScripts);
      
      message.success('Script executed successfully');
    } catch (error) {
      setOutputModal(prev => ({
        ...prev,
        output: `Error executing script: ${error.message}`,
        loading: false
      }));
      message.error(`Script execution failed: ${error.message}`);
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
      description: script.description,
      scriptPath: script.scriptPath,
      arguments: script.arguments
    });
    setModalVisible(true);
  };

  const handleSaveScript = () => {
    if (!form.name || !form.scriptPath) {
      message.error('Please fill in script name and path');
      return;
    }

    const newScript = {
      id: editingScript ? editingScript.id : Date.now(),
      name: form.name,
      description: form.description,
      scriptPath: form.scriptPath,
      arguments: form.arguments,
      createdAt: editingScript ? editingScript.createdAt : new Date().toISOString(),
      lastRun: null
    };

    let updatedScripts;
    if (editingScript) {
      updatedScripts = scripts.map(s => s.id === editingScript.id ? newScript : s);
    } else {
      updatedScripts = [...scripts, newScript];
    }

    saveScripts(updatedScripts);
    setModalVisible(false);
    message.success(editingScript ? 'Script updated successfully' : 'Script added successfully');
  };

  const handleDeleteScript = (scriptId) => {
    const updatedScripts = scripts.filter(s => s.id !== scriptId);
    saveScripts(updatedScripts);
    message.success('Script deleted successfully');
  };

  const handleSelectPath = () => {
    // Since we can't actually browse files in a web app, we'll provide a helpful input
    message.info('Please type the full path to your batch file (e.g., C:\\Scripts\\mtctl.bat)');
  };

  const handleQuickArgument = (value) => {
    setForm(prev => ({ ...prev, arguments: value }));
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
              {args.length > 40 ? `${args.substring(0, 40)}...` : args}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>No arguments</Text>
        )
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color="blue">Ready</Tag>
          {record.lastRun && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Last run: {new Date(record.lastRun).toLocaleString()}
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
              onClick={() => executeScript(record)}
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
            <Title level={4} style={{ margin: 0 }}>Script Manager</Title>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadScripts}
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
          message="Simple Script Management"
          description="Manage and execute your batch files with custom arguments. Perfect for your MTCTL script!"
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
            emptyText: 'No scripts configured. Click "Add Script" to get started!'
          }}
        />
      </Card>

      {/* Add/Edit Script Modal */}
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
        width={700}
        okText={editingScript ? 'Update Script' : 'Add Script'}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Script Name */}
          <div>
            <Text strong>Script Name *</Text>
            <Input
              placeholder="e.g., MTCTL Help, MTCTL Deploy Dev"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Description */}
          <div>
            <Text strong>Description</Text>
            <Input
              placeholder="Brief description of what this script does"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Script Path */}
          <div>
            <Text strong>Script Path *</Text>
            <Row gutter={8} style={{ marginTop: 4 }}>
              <Col flex="auto">
                <Input
                  placeholder="C:\Scripts\mtctl.bat"
                  value={form.scriptPath}
                  onChange={(e) => setForm(prev => ({ ...prev, scriptPath: e.target.value }))}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col>
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={handleSelectPath}
                  title="Path Helper"
                >
                  Help
                </Button>
              </Col>
            </Row>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Full path to your batch file (e.g., C:\Scripts\mtctl.bat)
            </Text>
          </div>

          {/* Quick Arguments */}
          <div>
            <Text strong>Quick Arguments</Text>
            <Select
              placeholder="Select common arguments or type custom ones below"
              style={{ width: '100%', marginTop: 4 }}
              onSelect={handleQuickArgument}
              allowClear
            >
              {commonArguments.map((arg, index) => (
                <Option key={index} value={arg.value}>
                  <div>
                    <Text strong>{arg.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {arg.value} - {arg.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          {/* Custom Arguments */}
          <div>
            <Text strong>Arguments</Text>
            <Input
              placeholder="--help, deploy --env=dev, etc."
              value={form.arguments}
              onChange={(e) => setForm(prev => ({ ...prev, arguments: e.target.value }))}
              style={{ marginTop: 4 }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Command line arguments to pass to your script
            </Text>
          </div>

          {/* Example */}
          <Alert
            message="Example Setup for Your MTCTL Script"
            description={
              <div>
                <Text strong>Name:</Text> MTCTL Help
                <br />
                <Text strong>Path:</Text> C:\Scripts\mtctl.bat
                <br />
                <Text strong>Arguments:</Text> --help
                <br />
                <br />
                <Text type="secondary">
                  This will execute: C:\Scripts\mtctl.bat --help
                </Text>
              </div>
            }
            type="success"
            showIcon={false}
            style={{ fontSize: '12px' }}
          />
        </Space>
      </Modal>

      {/* Script Output Modal */}
      <Modal
        title={
          <Space>
            <CodeOutlined />
            Script Output: {outputModal.script?.name}
            <Tag color={outputModal.loading ? 'blue' : 'green'}>
              {outputModal.loading ? 'Running...' : 'Completed'}
            </Tag>
          </Space>
        }
        open={outputModal.visible}
        onCancel={() => setOutputModal({ visible: false, script: null, output: '', loading: false })}
        footer={[
          <Button 
            key="close" 
            type="primary"
            onClick={() => setOutputModal({ visible: false, script: null, output: '', loading: false })}
          >
            Close
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Script:</Text>
              <br />
              <Text code style={{ fontSize: '12px' }}>{outputModal.script?.scriptPath}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Arguments:</Text>
              <br />
              <Text code style={{ fontSize: '12px' }}>{outputModal.script?.arguments || 'None'}</Text>
            </Col>
          </Row>
        </div>

        <div>
          <Text strong>Output:</Text>
          <div style={{
            background: '#000',
            color: '#00ff00',
            padding: '16px',
            borderRadius: '6px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13px',
            maxHeight: '400px',
            overflow: 'auto',
            marginTop: '8px',
            whiteSpace: 'pre-wrap',
            border: '1px solid #333'
          }}>
            {outputModal.loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text style={{ color: '#00ff00' }}>
                  ⏳ Executing script... Please wait...
                </Text>
              </div>
            ) : (
              outputModal.output || 'No output generated'
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SimpleScriptManager;
// Add this component to your SimpleScriptManager
// Update your SimpleScriptManager.js to include Kubernetes status

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
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const SimpleScriptManager = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [outputModal, setOutputModal] = useState({ visible: false, script: null, output: '', loading: false });
  const [kubeStatus, setKubeStatus] = useState(null); // New state for Kubernetes status
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
    { label: 'Stop Namespace', value: 'stop --namespace "tsutst"', description: 'Stop deployments in namespace' },
    { label: 'Start Namespace', value: 'start --namespace "tsutst"', description: 'Start deployments in namespace' },
    { label: 'Status Check', value: 'status --namespace "tsutst"', description: 'Check status of namespace' },
    { label: 'List Deployments', value: 'list --namespace "tsutst"', description: 'List all deployments' },
    { label: 'Deploy', value: 'deploy --namespace "tsutst"', description: 'Deploy to namespace' }
  ];

  useEffect(() => {
    loadScripts();
    checkKubernetesConfig(); // Check Kubernetes config on load
  }, []);

  // Check Kubernetes configuration status
  const checkKubernetesConfig = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/kubernetes-script-config');
      const data = await response.json();
      setKubeStatus(data);
    } catch (error) {
      console.error('Failed to check Kubernetes config:', error);
      setKubeStatus({
        configured: false,
        message: 'Unable to check Kubernetes configuration'
      });
    }
  };

  // Render Kubernetes status indicator
  const renderKubernetesStatus = () => {
    if (!kubeStatus) return null;

    const getStatusProps = () => {
      if (kubeStatus.configured && kubeStatus.kubeconfigExists) {
        return {
          type: "success",
          icon: <CheckCircleOutlined />,
          message: "Kubernetes Configuration Ready",
          description: `KUBECONFIG will be automatically used from: ${kubeStatus.kubeconfigPath}`
        };
      } else if (kubeStatus.configured && !kubeStatus.kubeconfigExists) {
        return {
          type: "warning", 
          icon: <ExclamationCircleOutlined />,
          message: "Kubernetes Configuration Issue",
          description: `KUBECONFIG file not found: ${kubeStatus.kubeconfigPath}`
        };
      } else {
        return {
          type: "info",
          icon: <InfoCircleOutlined />,
          message: "Kubernetes Not Configured",
          description: "Scripts will run without KUBECONFIG. Configure in Kubernetes settings if needed."
        };
      }
    };

    const statusProps = getStatusProps();

    return (
      <Alert
        {...statusProps}
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Button size="small" onClick={checkKubernetesConfig}>
            Refresh
          </Button>
        }
      />
    );
  };

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

  const saveScripts = (scriptList) => {
    try {
      localStorage.setItem('simpleScripts', JSON.stringify(scriptList));
      setScripts(scriptList);
    } catch (error) {
      console.error('Failed to save scripts:', error);
      message.error('Failed to save scripts');
    }
  };

  const executeScript = async (script) => {
    setOutputModal({ visible: true, script, output: '', loading: true });
    
    try {
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
      
      const updatedScripts = scripts.map(s => 
        s.id === script.id 
          ? { ...s, lastRun: new Date().toISOString() }
          : s
      );
      saveScripts(updatedScripts);
      
      // Show success message with Kubernetes info
      if (result.kubeconfigUsed) {
        message.success('Script executed successfully with KUBECONFIG');
      } else {
        message.success('Script executed successfully');
      }
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
        {/* Kubernetes Status Indicator */}
        {renderKubernetesStatus()}

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
            <Input
              placeholder="Full path to your MTCTL script"
              value={form.scriptPath}
              onChange={(e) => setForm(prev => ({ ...prev, scriptPath: e.target.value }))}
              prefix={<FileTextOutlined />}
              style={{ marginTop: 4 }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              e.g., E:\ifsroot\deliveries\...\mtctl.cmd
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
              placeholder="--help, stop --namespace tsutst, etc."
              value={form.arguments}
              onChange={(e) => setForm(prev => ({ ...prev, arguments: e.target.value }))}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Information Alert */}
          <Alert
            message="Automatic Kubernetes Integration"
            description="Your KUBECONFIG will be automatically applied from your Kubernetes configuration settings. No need to set environment variables manually."
            type="info"
            showIcon
          />
        </Space>
      </Modal>

      {/* Script Output Modal - same as before */}
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
// Debug Component to Test Script Execution and Network
// File: frontend/src/components/Scripts/ScriptDebugger.js

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Steps,
  Result,
  Spin,
  Tag,
  Descriptions,
  Divider
} from 'antd';
import { 
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  NetworkOutlined,
  CodeOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { scriptAPI } from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const ScriptDebugger = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepResults, setStepResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const debugSteps = [
    {
      title: 'Backend Connection',
      description: 'Test connection to the backend server'
    },
    {
      title: 'API Endpoints',
      description: 'Verify script API endpoints are working'
    },
    {
      title: 'Script Validation',
      description: 'Test script path validation'
    },
    {
      title: 'Simple Script Test',
      description: 'Run a basic system command'
    }
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setStepResults({});

    // Step 1: Test Backend Connection
    try {
      setCurrentStep(0);
      console.log('🔗 Testing backend connection...');
      const healthCheck = await scriptAPI.testConnection();
      
      setStepResults(prev => ({
        ...prev,
        step0: {
          success: healthCheck.success,
          message: healthCheck.success ? 'Backend connection successful' : healthCheck.error,
          details: healthCheck.data
        }
      }));

      if (!healthCheck.success) {
        setIsRunning(false);
        return;
      }

      // Step 2: Test API Endpoints
      setCurrentStep(1);
      console.log('📡 Testing script API endpoints...');
      const scriptsResponse = await scriptAPI.getAllScripts();
      
      setStepResults(prev => ({
        ...prev,
        step1: {
          success: scriptsResponse.success,
          message: scriptsResponse.success ? 'Script API endpoints working' : 'Script API failed',
          details: { scriptCount: scriptsResponse.data?.length || 0 }
        }
      }));

      if (!scriptsResponse.success) {
        setIsRunning(false);
        return;
      }

      // Step 3: Test Path Validation
      setCurrentStep(2);
      console.log('🔍 Testing path validation...');
      const validationResponse = await scriptAPI.validatePath({ 
        scriptPath: process.platform === 'win32' ? 'systeminfo' : 'uname'
      });
      
      setStepResults(prev => ({
        ...prev,
        step2: {
          success: validationResponse.valid,
          message: validationResponse.valid ? 'Path validation working' : validationResponse.error,
          details: validationResponse
        }
      }));

      // Step 4: Test Simple Script Execution
      setCurrentStep(3);
      console.log('🏃 Testing simple script execution...');
      
      // First, create a test script
      const testScript = {
        name: 'Debug Test Script',
        description: 'Simple test script for debugging',
        scriptPath: process.platform === 'win32' ? 'echo' : 'echo',
        arguments: 'Hello from script debugger!'
      };

      try {
        // Add test script
        const addResponse = await scriptAPI.addScript(testScript);
        
        if (addResponse.success) {
          // Run the test script
          const runResponse = await scriptAPI.runScript(addResponse.data.id);
          
          // Clean up - delete the test script
          await scriptAPI.deleteScript(addResponse.data.id);
          
          setStepResults(prev => ({
            ...prev,
            step3: {
              success: runResponse.success,
              message: runResponse.success ? 'Script execution successful' : runResponse.error,
              details: {
                output: runResponse.output,
                executedAt: runResponse.executedAt
              }
            }
          }));
        } else {
          setStepResults(prev => ({
            ...prev,
            step3: {
              success: false,
              message: 'Failed to create test script',
              details: { error: addResponse.error }
            }
          }));
        }
      } catch (scriptError) {
        console.error('Script execution test failed:', scriptError);
        setStepResults(prev => ({
          ...prev,
          step3: {
            success: false,
            message: `Script execution failed: ${scriptError.message}`,
            details: { error: scriptError.message }
          }
        }));
      }

    } catch (error) {
      console.error('Diagnostic error:', error);
      setStepResults(prev => ({
        ...prev,
        [`step${currentStep}`]: {
          success: false,
          message: `Diagnostic failed: ${error.message}`,
          details: { error: error.message }
        }
      }));
    }

    setIsRunning(false);
  };

  const getStepStatus = (stepIndex) => {
    if (isRunning && currentStep === stepIndex) return 'process';
    if (stepResults[`step${stepIndex}`]) {
      return stepResults[`step${stepIndex}`].success ? 'finish' : 'error';
    }
    return 'wait';
  };

  const getStepIcon = (stepIndex) => {
    if (isRunning && currentStep === stepIndex) {
      return <LoadingOutlined />;
    }
    if (stepResults[`step${stepIndex}`]) {
      return stepResults[`step${stepIndex}`].success ? 
        <CheckCircleOutlined /> : <ExclamationCircleOutlined />;
    }
    return null;
  };

  const renderDiagnosticResults = () => {
    const allStepsCompleted = Object.keys(stepResults).length === debugSteps.length;
    const hasErrors = Object.values(stepResults).some(result => !result.success);

    if (!allStepsCompleted) return null;

    return (
      <Card style={{ marginTop: 24 }}>
        <Result
          status={hasErrors ? 'error' : 'success'}
          title={hasErrors ? 'Issues Found' : 'All Tests Passed'}
          subTitle={
            hasErrors 
              ? 'Some diagnostic tests failed. Check the details below.'
              : 'Your script execution system is working correctly!'
          }
        />
        
        <Divider />
        
        {Object.entries(stepResults).map(([stepKey, result], index) => (
          <div key={stepKey} style={{ marginBottom: 16 }}>
            <Descriptions 
              title={
                <Space>
                  {result.success ? 
                    <Tag color="success">PASS</Tag> : 
                    <Tag color="error">FAIL</Tag>
                  }
                  {debugSteps[index].title}
                </Space>
              }
              size="small"
              column={1}
            >
              <Descriptions.Item label="Status">
                {result.message}
              </Descriptions.Item>
              {result.details && (
                <Descriptions.Item label="Details">
                  <pre style={{ 
                    fontSize: '12px', 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        ))}

        {hasErrors && (
          <Alert
            message="Troubleshooting Tips"
            description={
              <div>
                <Paragraph>
                  <Text strong>If backend connection failed:</Text>
                  <br />
                  • Check if your backend server is running on port 5001
                  <br />
                  • Verify the API base URL in your frontend configuration
                  <br />
                  • Check browser console for CORS errors
                </Paragraph>
                
                <Paragraph>
                  <Text strong>If script execution failed:</Text>
                  <br />
                  • Check backend console logs for detailed error messages
                  <br />
                  • Verify script permissions (especially on Linux/macOS)
                  <br />
                  • Try running the script manually on the server
                  <br />
                  • Check if the script path exists and is accessible
                </Paragraph>
                
                <Paragraph>
                  <Text strong>If network errors persist:</Text>
                  <br />
                  • Check firewall settings
                  <br />
                  • Verify antivirus isn't blocking the connection
                  <br />
                  • Try running backend and frontend on the same machine
                  <br />
                  • Check network proxy settings
                </Paragraph>
              </div>
            }
            type="warning"
            showIcon
          />
        )}
      </Card>
    );
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <BugOutlined />
            <Title level={4} style={{ margin: 0 }}>Script Execution Debugger</Title>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<ToolOutlined />}
            onClick={runDiagnostics}
            loading={isRunning}
            disabled={isRunning}
          >
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
        }
      >
        <Alert
          message="Script Network Error Troubleshooting"
          description="This tool will run a series of tests to identify why script execution is failing with network errors."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Steps 
          current={currentStep} 
          direction="vertical"
          style={{ marginBottom: 24 }}
        >
          {debugSteps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              status={getStepStatus(index)}
              icon={getStepIcon(index)}
            />
          ))}
        </Steps>

        {isRunning && (
          <Card>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <Text style={{ marginLeft: 16 }}>
              Running diagnostic step: {debugSteps[currentStep]?.title}
            </Text>
          </Card>
        )}

        {renderDiagnosticResults()}

        <Card style={{ marginTop: 24 }} size="small">
          <Title level={5}>Quick Manual Tests</Title>
          <Paragraph>
            <Text strong>Test these manually to help debug:</Text>
          </Paragraph>
          <Paragraph>
            1. <Text code>curl http://localhost:5001/api/health</Text> - Test backend
            <br />
            2. <Text code>curl http://localhost:5001/api/scripts</Text> - Test script API
            <br />
            3. Check browser Network tab for failed requests
            <br />
            4. Check backend console for error messages
          </Paragraph>
        </Card>
      </Card>
    </div>
  );
};

export default ScriptDebugger;
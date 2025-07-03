import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  DatabaseOutlined, 
  UserOutlined, 
  SettingOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  MailOutlined,
  MonitorOutlined,
  DesktopOutlined,
  CloudOutlined,
  GlobalOutlined,
  AlertOutlined,
  CodeOutlined  
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ModeFlag from './ModeFlag';
import { useMode } from '../../contexts/ModeContext';

const { Sider } = Layout;

const Sidebar = ({ currentPage, onPageChange }) => {
  const { isAdmin } = useAuth();
  const { isDarkMode } = useTheme();
  const { isServerMode } = useMode();

  const baseMenuItems = [
    {
      key: 'url-monitoring',
      icon: <GlobalOutlined />,
      label: 'URL Monitoring',
    },    
    {
      key: 'script-manager',
      icon: <CodeOutlined />,
      label: 'Script Manager',
    },
  ];

  const serverModeItems = [
    {
      key: 'realtime-dashboard',
      icon: <MonitorOutlined />,
      label: 'Real-time Monitor',
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard Details',
    },
    
    {
      key: 'downtime-logs',
      icon: <ClockCircleOutlined />,
      label: 'Downtime Logs',
    },
    {
      key: 'system-metrics',
      icon: <DesktopOutlined />,
      label: 'System Performance',
    },
    {
      key: 'kubernetes',
      icon: <CloudOutlined />,
      label: 'Kubernetes Pods',
    },
  ];

  
  const menuItems = isServerMode 
    ? [...serverModeItems, ...baseMenuItems] 
    : baseMenuItems;

  if (isAdmin) {
    menuItems.push(
      {
        type: 'divider',
      },
      {
        key: 'admin-section',
        label: 'Administration',
        type: 'group',
      },
      {
        key: 'database-config',
        icon: <SettingOutlined />,
        label: 'Database Config',
      },
      {
        key: 'email-config',
        icon: <MailOutlined />,
        label: 'Email Config',
      },
      {
      key: 'threshold-config',  // ADD THIS
      icon: <AlertOutlined />,
      label: 'Alert Thresholds',
    },
      {
        key: 'users',
        icon: <UserOutlined />,
        label: 'User Management',
      },      
      {
        key: 'kubernetes-config',
        icon: <SettingOutlined />,
        label: 'Kubernetes Config',
      },    
    );
  }

  // Modern dark theme similar to Ant Design Pro
  const siderStyle = {
    background: isDarkMode ? '#141414' : '#f0f2f5',
    boxShadow: isDarkMode 
      ? '2px 0 8px 0 rgba(29, 35, 41, 0.05)' 
      : '2px 0 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    borderRight: isDarkMode ? '1px solid #303030' : '1px solid #e8e8e8'
  };

  const logoStyle = {
    color: isDarkMode ? 'white' : '#262626',
    padding: '20px 16px',
    textAlign: 'center',
    borderBottom: isDarkMode ? '1px solid #303030' : '1px solid #e8e8e8',
    background: isDarkMode ? '#141414' : '#ffffff',
    transition: 'all 0.3s ease',
    display: 'flex',           // Makes it a flex container
    flexDirection: 'column',   // Stacks items vertically
    alignItems: 'center',      // Centers all child elements horizontally
    gap: '8px'  
  };

  return (
    <Sider width={250} style={siderStyle}>
      <div style={logoStyle}>
        
        <div style={{ 
          fontWeight: 600, 
          color: isDarkMode ? '#ffffff' : '#262626',
          fontSize: '16px',
          transition: 'color 0.3s ease',
          letterSpacing: '0.02em'
        }}>
          Uptime WatchDog
        </div>
        <div style={{
          fontSize: '12px',
          color: isDarkMode ? '#8c8c8c' : '#8c8c8c'          
        }}>
          Database Monitoring System
        </div>
        <ModeFlag />
      </div>
      
      <Menu
        theme={isDarkMode ? 'dark' : 'light'}
        mode="inline"
        selectedKeys={[currentPage]}
        onClick={({ key }) => onPageChange(key)}
        items={menuItems}
        style={{
          marginTop: 8,
          background: isDarkMode ? '#141414' : '#f0f2f5',
          border: 'none',
          transition: 'all 0.3s ease',
          fontSize: '14px'
        }}
      />
    </Sider>
  );
};

export default Sidebar;
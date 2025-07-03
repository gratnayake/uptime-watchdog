// backend/services/scriptService.js - ENHANCED VERSION
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const oracledb = require('oracledb');
const dbConfigService = require('./dbConfigService');

const execAsync = util.promisify(exec);

class ScriptService {
  constructor() {
    this.scriptsFile = path.join(__dirname, '../data/scripts.json');
    this.ensureScriptsFile();
    this.isDbOperationInProgress = false;
  }

  ensureScriptsFile() {
    if (!fs.existsSync(this.scriptsFile)) {
      const defaultScripts = {
        scripts: [
          {
            id: 1,
            name: 'System Information',
            description: 'Display basic system information',
            scriptPath: 'systeminfo',
            arguments: '',
            type: 'system',
            lastRunAt: null,
            lastStatus: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Directory Listing',
            description: 'List current directory contents',
            scriptPath: 'dir',
            arguments: '/w',
            type: 'system',
            lastRunAt: null,
            lastStatus: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            name: 'Oracle Database Shutdown',
            description: 'Shutdown Oracle Database with IMMEDIATE mode',
            scriptPath: 'ORACLE_DB_SHUTDOWN',
            arguments: 'immediate',
            type: 'database',
            lastRunAt: null,
            lastStatus: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 4,
            name: 'Oracle Database Startup',
            description: 'Startup Oracle Database',
            scriptPath: 'ORACLE_DB_STARTUP',
            arguments: 'open',
            type: 'database',
            lastRunAt: null,
            lastStatus: null,
            createdAt: new Date().toISOString()
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      this.saveScripts(defaultScripts);
      console.log('📜 Created default scripts with Oracle DB controls');
    }
  }

  loadScripts() {
    try {
      const data = fs.readFileSync(this.scriptsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading scripts:', error);
      return { scripts: [], lastUpdated: new Date().toISOString() };
    }
  }

  saveScripts(scriptData) {
    try {
      const dataToSave = {
        ...scriptData,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.scriptsFile, JSON.stringify(dataToSave, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving scripts:', error);
      return false;
    }
  }

  getAllScripts() {
    const data = this.loadScripts();
    return data.scripts || [];
  }

  addScript(scriptData) {
    const data = this.loadScripts();
    const newScript = {
      id: Date.now(),
      name: scriptData.name,
      description: scriptData.description || '',
      scriptPath: scriptData.scriptPath,
      arguments: scriptData.arguments || '',
      type: scriptData.type || 'system',
      lastRunAt: null,
      lastStatus: null,
      createdAt: new Date().toISOString()
    };

    data.scripts = data.scripts || [];
    data.scripts.push(newScript);
    
    if (this.saveScripts(data)) {
      return newScript;
    }
    return null;
  }

  updateScript(scriptId, scriptData) {
    const data = this.loadScripts();
    const scriptIndex = data.scripts.findIndex(s => s.id === parseInt(scriptId));
    
    if (scriptIndex === -1) return null;
    
    data.scripts[scriptIndex] = {
      ...data.scripts[scriptIndex],
      name: scriptData.name,
      description: scriptData.description || '',
      scriptPath: scriptData.scriptPath,
      arguments: scriptData.arguments || '',
      type: scriptData.type || data.scripts[scriptIndex].type || 'system',
      updatedAt: new Date().toISOString()
    };
    
    if (this.saveScripts(data)) {
      return data.scripts[scriptIndex];
    }
    return null;
  }

  deleteScript(scriptId) {
    const data = this.loadScripts();
    const scriptIndex = data.scripts.findIndex(s => s.id === parseInt(scriptId));
    
    if (scriptIndex === -1) return false;
    
    data.scripts.splice(scriptIndex, 1);
    return this.saveScripts(data);
  }

  /**
   * Oracle Database Shutdown Operation
   */
  async executeDatabaseShutdown(mode = 'immediate') {
    if (this.isDbOperationInProgress) {
      throw new Error('Database operation already in progress');
    }

    this.isDbOperationInProgress = true;
    console.log(`🔄 Starting Oracle database shutdown with mode: ${mode}`);

    try {
      // Validate shutdown mode
      const validModes = ['immediate', 'normal', 'abort'];
      if (!validModes.includes(mode.toLowerCase())) {
        throw new Error(`Invalid shutdown mode. Use: ${validModes.join(', ')}`);
      }

      // Get database configuration
      const config = dbConfigService.getConfig();
      if (!config.isConfigured) {
        throw new Error('Database not configured. Please configure database connection first.');
      }

      console.log('🔗 Connecting to Oracle with SYSDBA privileges...');

      // Create connection with SYSDBA privileges for shutdown
      const connection = await oracledb.getConnection({
        user: config.user,
        password: config.password,
        connectString: config.connectString,
        privilege: oracledb.SYSDBA // Required for shutdown operations
      });

      console.log('✅ Connected with SYSDBA privileges');

      // Execute shutdown command
      const shutdownCommand = `SHUTDOWN ${mode.toUpperCase()}`;
      console.log(`🔄 Executing: ${shutdownCommand}`);

      await connection.execute(shutdownCommand);
      
      // Close the connection
      await connection.close();
      
      const successMessage = `✅ Oracle Database shutdown ${mode} completed successfully`;
      console.log(successMessage);
      
      return {
        success: true,
        output: `Database shutdown completed successfully.\n\nMode: ${mode.toUpperCase()}\nTimestamp: ${new Date().toLocaleString()}\n\n${successMessage}`,
        executedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Database shutdown failed:', error);
      
      let errorMessage = `Database shutdown failed: ${error.message}`;
      
      // Add helpful error explanations
      if (error.message.includes('privilege')) {
        errorMessage += '\n\nNote: SYSDBA privilege is required for shutdown operations.';
      }
      
      if (error.message.includes('not configured')) {
        errorMessage += '\n\nPlease configure the database connection in Database Config first.';
      }

      return {
        success: false,
        output: errorMessage,
        executedAt: new Date().toISOString(),
        error: error.message
      };
    } finally {
      this.isDbOperationInProgress = false;
    }
  }

  /**
   * Oracle Database Startup Operation
   */
  async executeDatabaseStartup(mode = 'open') {
    if (this.isDbOperationInProgress) {
      throw new Error('Database operation already in progress');
    }

    this.isDbOperationInProgress = true;
    console.log(`🔄 Starting Oracle database startup with mode: ${mode}`);

    try {
      // Validate startup mode
      const validModes = ['open', 'mount', 'nomount'];
      if (!validModes.includes(mode.toLowerCase())) {
        throw new Error(`Invalid startup mode. Use: ${validModes.join(', ')}`);
      }

      // Get database configuration
      const config = dbConfigService.getConfig();
      if (!config.isConfigured) {
        throw new Error('Database not configured. Please configure database connection first.');
      }

      console.log('🔗 Connecting to Oracle with SYSDBA privileges...');

      // For startup, we need to connect to a potentially down database
      // So we'll connect to the instance (not the database)
      const connection = await oracledb.getConnection({
        user: config.user,
        password: config.password,
        connectString: config.connectString,
        privilege: oracledb.SYSDBA
      });

      console.log('✅ Connected with SYSDBA privileges');

      // Execute startup command
      let startupCommand;
      if (mode.toLowerCase() === 'open') {
        startupCommand = 'STARTUP';
      } else {
        startupCommand = `STARTUP ${mode.toUpperCase()}`;
      }
      
      console.log(`🔄 Executing: ${startupCommand}`);

      await connection.execute(startupCommand);
      
      // If we're opening the database, we might need additional steps
      if (mode.toLowerCase() === 'mount') {
        console.log('📌 Database mounted successfully');
      } else if (mode.toLowerCase() === 'nomount') {
        console.log('🚀 Instance started (nomount mode)');
      } else {
        console.log('🗄️ Database opened successfully');
      }
      
      // Close the connection
      await connection.close();
      
      const successMessage = `✅ Oracle Database startup ${mode} completed successfully`;
      console.log(successMessage);
      
      return {
        success: true,
        output: `Database startup completed successfully.\n\nMode: ${mode.toUpperCase()}\nTimestamp: ${new Date().toLocaleString()}\n\n${successMessage}`,
        executedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Database startup failed:', error);
      
      let errorMessage = `Database startup failed: ${error.message}`;
      
      // Add helpful error explanations
      if (error.message.includes('privilege')) {
        errorMessage += '\n\nNote: SYSDBA privilege is required for startup operations.';
      }
      
      if (error.message.includes('not configured')) {
        errorMessage += '\n\nPlease configure the database connection in Database Config first.';
      }

      return {
        success: false,
        output: errorMessage,
        executedAt: new Date().toISOString(),
        error: error.message
      };
    } finally {
      this.isDbOperationInProgress = false;
    }
  }

  async runScript(scriptId) {
    const scripts = this.getAllScripts();
    const script = scripts.find(s => s.id === parseInt(scriptId));
    
    if (!script) {
      throw new Error('Script not found');
    }

    try {
      console.log(`🏃 Running script: ${script.name}`);
      console.log(`📁 Path: ${script.scriptPath}`);
      console.log(`⚙️ Arguments: ${script.arguments}`);

      // Update script status to running
      this.updateScriptStatus(scriptId, 'running');

      // Check if this is a database operation
      if (script.scriptPath === 'ORACLE_DB_SHUTDOWN') {
        const mode = script.arguments || 'immediate';
        return await this.executeDatabaseShutdown(mode);
      }
      
      if (script.scriptPath === 'ORACLE_DB_STARTUP') {
        const mode = script.arguments || 'open';
        return await this.executeDatabaseStartup(mode);
      }

      // Regular script execution
      // Construct the command
      let command = script.scriptPath;
      
      // Add arguments if they exist
      if (script.arguments && script.arguments.trim()) {
        command += ` ${script.arguments.trim()}`;
      }

      // Add quotes around the path if it contains spaces and isn't already quoted
      if (script.scriptPath.includes(' ') && !script.scriptPath.startsWith('"')) {
        command = `"${script.scriptPath}"`;
        if (script.arguments && script.arguments.trim()) {
          command += ` ${script.arguments.trim()}`;
        }
      }

      console.log(`🖥️ Executing command: ${command}`);

      // Execute the script with a timeout of 5 minutes
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        windowsHide: true,
        shell: true
      });

      // Combine stdout and stderr
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      console.log(`✅ Script completed successfully`);

      // Update script status
      this.updateScriptStatus(scriptId, 'success');

      return {
        success: true,
        output: output || 'Script completed successfully (no output)',
        executedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Script execution failed:`, error);

      // Update script status
      this.updateScriptStatus(scriptId, 'failed');

      let errorOutput = `Error: ${error.message}`;
      
      // Include stdout/stderr if available
      if (error.stdout) errorOutput += `\n\nOutput:\n${error.stdout}`;
      if (error.stderr) errorOutput += `\n\nError Output:\n${error.stderr}`;

      return {
        success: false,
        output: errorOutput,
        error: error.message,
        executedAt: new Date().toISOString()
      };
    }
  }

  updateScriptStatus(scriptId, status) {
    const data = this.loadScripts();
    const scriptIndex = data.scripts.findIndex(s => s.id === parseInt(scriptId));
    
    if (scriptIndex !== -1) {
      data.scripts[scriptIndex].lastStatus = status;
      data.scripts[scriptIndex].lastRunAt = new Date().toISOString();
      this.saveScripts(data);
    }
  }

  validateScriptPath(scriptPath) {
    try {
      // Handle special database operations
      if (scriptPath === 'ORACLE_DB_SHUTDOWN' || scriptPath === 'ORACLE_DB_STARTUP') {
        return { valid: true, message: 'Oracle database operation' };
      }

      // Check if the file exists for regular scripts
      if (!fs.existsSync(scriptPath)) {
        return { valid: false, error: 'Script file does not exist' };
      }

      // Check if it's a file (not a directory)
      const stats = fs.statSync(scriptPath);
      if (!stats.isFile()) {
        return { valid: false, error: 'Path is not a file' };
      }

      // Check file extension for common script types
      const ext = path.extname(scriptPath).toLowerCase();
      const allowedExtensions = ['.bat', '.cmd', '.ps1', '.exe', '.com'];
      
      if (!allowedExtensions.includes(ext)) {
        console.warn(`Warning: Unusual file extension ${ext} for script ${scriptPath}`);
      }

      return { valid: true, message: 'Script file is valid' };
    } catch (error) {
      return { valid: false, error: `Error validating script: ${error.message}` };
    }
  }

  getScriptExecutionHistory(scriptId) {
    const scripts = this.getAllScripts();
    const script = scripts.find(s => s.id === parseInt(scriptId));
    
    if (!script) return null;
    
    return {
      scriptId: script.id,
      scriptName: script.name,
      lastRunAt: script.lastRunAt,
      lastStatus: script.lastStatus
    };
  }
}

module.exports = new ScriptService();
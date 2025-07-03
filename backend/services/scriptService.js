// Improved Script Service - backend/services/scriptService.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const os = require('os');

const execAsync = util.promisify(exec);

class ScriptService {
  constructor() {
    this.scriptsFile = path.join(__dirname, '../data/scripts.json');
    this.ensureDataDirectory();
    this.ensureScriptsFile();
  }

  ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }
  }

  ensureScriptsFile() {
    if (!fs.existsSync(this.scriptsFile)) {
      const defaultScripts = {
        scripts: [
          {
            id: 1,
            name: 'System Information',
            description: 'Display basic system information',
            scriptPath: os.platform() === 'win32' ? 'systeminfo' : 'uname -a',
            arguments: '',
            lastRunAt: null,
            lastStatus: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Directory Listing',
            description: 'List current directory contents',
            scriptPath: os.platform() === 'win32' ? 'dir' : 'ls',
            arguments: os.platform() === 'win32' ? '/w' : '-la',
            lastRunAt: null,
            lastStatus: null,
            createdAt: new Date().toISOString()
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      this.saveScripts(defaultScripts);
      console.log('📜 Created default scripts configuration');
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
      scriptPath: scriptData.scriptPath.trim(),
      arguments: scriptData.arguments || '',
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
      scriptPath: scriptData.scriptPath.trim(),
      arguments: scriptData.arguments || '',
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

  // IMPROVED PATH VALIDATION
  validateScriptPath(scriptPath) {
    try {
      if (!scriptPath || scriptPath.trim() === '') {
        return { valid: false, error: 'Script path cannot be empty' };
      }

      const cleanPath = scriptPath.trim();
      console.log(`🔍 Validating script path: "${cleanPath}"`);

      // Check for system commands first (don't require file existence)
      const systemCommands = [
        'systeminfo', 'dir', 'ipconfig', 'netstat', 'tasklist', 'ping',
        'whoami', 'hostname', 'date', 'time', 'echo', 'cls', 'type',
        'ls', 'ps', 'uname', 'df', 'free', 'top', 'cat', 'grep',
        'python', 'node', 'npm', 'git', 'docker', 'kubectl'
      ];

      const commandName = cleanPath.split(' ')[0].toLowerCase();
      const isSystemCommand = systemCommands.includes(commandName) || 
                             systemCommands.includes(path.basename(commandName, path.extname(commandName)));

      if (isSystemCommand) {
        console.log(`✅ System command detected: ${commandName}`);
        return { 
          valid: true, 
          message: `System command '${commandName}' is valid`,
          isSystemCommand: true 
        };
      }

      // For file paths, check if file exists
      let filePath = cleanPath;
      
      // Handle quoted paths
      if ((filePath.startsWith('"') && filePath.endsWith('"')) ||
          (filePath.startsWith("'") && filePath.endsWith("'"))) {
        filePath = filePath.slice(1, -1);
      }

      // Extract just the executable path (before any arguments)
      const pathParts = filePath.split(' ');
      const executablePath = pathParts[0];

      if (!fs.existsSync(executablePath)) {
        // Try to resolve the path
        const resolvedPath = path.resolve(executablePath);
        if (!fs.existsSync(resolvedPath)) {
          return { 
            valid: false, 
            error: `File not found: "${executablePath}". Please check the path and ensure the file exists.`
          };
        }
        filePath = resolvedPath;
      }

      // Check if it's a file (not a directory)
      const stats = fs.statSync(executablePath);
      if (!stats.isFile()) {
        return { valid: false, error: 'Path must point to a file, not a directory' };
      }

      // Check file extension for Windows
      if (os.platform() === 'win32') {
        const ext = path.extname(executablePath).toLowerCase();
        const allowedExtensions = ['.bat', '.cmd', '.ps1', '.exe', '.com', '.msi'];
        
        if (!allowedExtensions.includes(ext)) {
          return { 
            valid: false, 
            error: `Unsupported file type: ${ext}. Allowed types: ${allowedExtensions.join(', ')}`
          };
        }
      } else {
        // For Unix-like systems, check if file is executable
        try {
          fs.accessSync(executablePath, fs.constants.X_OK);
        } catch (error) {
          console.warn(`Warning: File may not be executable: ${executablePath}`);
          // Don't fail validation, just warn
        }
      }

      console.log(`✅ File path validated: ${executablePath}`);
      return { 
        valid: true, 
        message: 'Script file is valid and accessible',
        isSystemCommand: false,
        resolvedPath: executablePath
      };

    } catch (error) {
      console.error(`❌ Path validation error:`, error);
      return { 
        valid: false, 
        error: `Error validating script path: ${error.message}` 
      };
    }
  }

  // IMPROVED SCRIPT EXECUTION
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

      // Prepare the command
      let command = this.prepareCommand(script.scriptPath, script.arguments);
      
      console.log(`🖥️ Executing command: ${command}`);

      // Execute with improved error handling
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        windowsHide: true,
        shell: true,
        cwd: os.homedir() // Set working directory to user home
      });

      // Combine output
      let output = '';
      if (stdout) output += `STDOUT:\n${stdout}\n`;
      if (stderr) output += `STDERR:\n${stderr}\n`;
      
      if (!output.trim()) {
        output = 'Script completed successfully (no output)';
      }

      console.log(`✅ Script completed successfully`);

      // Update script status
      this.updateScriptStatus(scriptId, 'success');

      return {
        success: true,
        output: output,
        executedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Script execution failed:`, error);

      // Update script status
      this.updateScriptStatus(scriptId, 'failed');

      let errorOutput = `Error: ${error.message}\n`;
      
      // Include stdout/stderr if available
      if (error.stdout) errorOutput += `\nOutput:\n${error.stdout}`;
      if (error.stderr) errorOutput += `\nError Output:\n${error.stderr}`;

      return {
        success: false,
        output: errorOutput,
        error: error.message,
        executedAt: new Date().toISOString()
      };
    }
  }

  // Helper method to prepare command for execution
  prepareCommand(scriptPath, args) {
    let command = scriptPath.trim();
    
    // Handle spaces in path
    if (command.includes(' ') && !command.startsWith('"') && !command.startsWith("'")) {
      // Check if it's a system command
      const firstWord = command.split(' ')[0];
      const systemCommands = ['systeminfo', 'dir', 'ipconfig', 'netstat', 'tasklist', 'ping', 'ls', 'ps', 'uname'];
      
      if (!systemCommands.includes(firstWord.toLowerCase())) {
        command = `"${command}"`;
      }
    }
    
    // Add arguments if they exist
    if (args && args.trim()) {
      command += ` ${args.trim()}`;
    }
    
    return command;
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

  getScriptExecutionHistory(scriptId) {
    const scripts = this.getAllScripts();
    const script = scripts.find(s => s.id === parseInt(scriptId));
    
    if (!script) return null;
    
    return {
      scriptId: script.id,
      scriptName: script.name,
      lastRunAt: script.lastRunAt,
      lastStatus: script.lastStatus,
      scriptPath: script.scriptPath,
      arguments: script.arguments
    };
  }

  // New method to get suggested script paths
  getSuggestedPaths() {
    const suggestions = [];
    
    if (os.platform() === 'win32') {
      suggestions.push(
        'C:\\Windows\\System32\\systeminfo.exe',
        'C:\\Windows\\System32\\ipconfig.exe',
        'C:\\Windows\\System32\\ping.exe',
        'C:\\Windows\\System32\\netstat.exe',
        'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
        'systeminfo',
        'dir',
        'ipconfig /all',
        'ping google.com'
      );
    } else {
      suggestions.push(
        '/bin/ls',
        '/bin/ps',
        '/usr/bin/uname',
        '/usr/bin/df',
        '/usr/bin/free',
        'ls -la',
        'ps aux',
        'uname -a',
        'df -h'
      );
    }
    
    return suggestions;
  }
}

module.exports = new ScriptService();
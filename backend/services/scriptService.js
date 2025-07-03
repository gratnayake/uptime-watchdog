const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class ScriptService {
  constructor() {
    this.scriptsFile = path.join(__dirname, '../data/scripts.json');
    this.ensureScriptsFile();
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
      scriptPath: scriptData.scriptPath,
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
      scriptPath: scriptData.scriptPath,
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
      // Check if the file exists
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
    // In a real implementation, you might want to store execution history separately
    // For now, we'll just return the last run information
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
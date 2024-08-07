const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

class Logger {
    constructor(owner, options = {}) {
        this.owner = owner;
        this.isMonitoring = false;
        this.logDir = options.logDir || path.join(__dirname, 'resources');
        this.logFileName = options.logFileName || 'log.txt';
        this.filePath = path.join(this.logDir, this.logFileName);

        // Ensure the log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // Initialize the log file if it doesn't exist
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, '', 'utf8');
        }
    }

    log(message) {
        const logMessage = `[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] [${this.owner}] -> ${message}\n`;
        if (this.isMonitoring) {
            console.log(logMessage);
        }

        fs.appendFile(this.filePath, logMessage, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing to log file: ${err.message}`);
            }
        });
    }

    printLog() {
        fs.readFile(this.filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading log file: ${err.message}`);
            } else {
                console.log(data);
            }
        });
    }

    printLogForOwner(owner) {
        fs.readFile(this.filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading log file: ${err.message}`);
            } else {
                const lines = data.split('\n');
                lines.forEach((line) => {
                    if (line.includes(`[${owner}]`)) {
                        console.log(line);
                    }
                });
            }
        });
    }

    getMonitoring() {
        return this.isMonitoring;
    }

    setMonitoring(monitoring) {
        this.isMonitoring = monitoring;
    }

    rotateLogs() {
        const archiveFilePath = path.join(this.logDir, `log_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`);
        fs.rename(this.filePath, archiveFilePath, (err) => {
            if (err) {
                console.error(`Error rotating log file: ${err.message}`);
                return;
            }
            fs.writeFileSync(this.filePath, '', 'utf8');
            console.log(`Log file rotated to: ${archiveFilePath}`);
        });
    }
}

module.exports = Logger;

/**
 * Sistema de logs simples para a aplicação
 */

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class Logger {
    static formatMessage(level, message, extra = null) {
        const timestamp = new Date().toISOString();
        const baseMsg = `[${timestamp}] [${level}] ${message}`;
        
        if (extra) {
            return `${baseMsg}\n${JSON.stringify(extra, null, 2)}`;
        }
        
        return baseMsg;
    }

    static info(message, extra = null) {
        const formatted = this.formatMessage('INFO', message, extra);
        console.log(`${colors.cyan}${formatted}${colors.reset}`);
    }

    static success(message, extra = null) {
        const formatted = this.formatMessage('SUCCESS', message, extra);
        console.log(`${colors.green}${formatted}${colors.reset}`);
    }

    static warn(message, extra = null) {
        const formatted = this.formatMessage('WARN', message, extra);
        console.warn(`${colors.yellow}${formatted}${colors.reset}`);
    }

    static error(message, extra = null) {
        const formatted = this.formatMessage('ERROR', message, extra);
        console.error(`${colors.red}${formatted}${colors.reset}`);
    }

    static debug(message, extra = null) {
        if (process.env.NODE_ENV === 'development') {
            const formatted = this.formatMessage('DEBUG', message, extra);
            console.log(`${colors.magenta}${formatted}${colors.reset}`);
        }
    }

    static http(req, res, next) {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            const method = req.method;
            const url = req.originalUrl;
            
            let color = colors.green; // 2xx
            if (status >= 400 && status < 500) color = colors.yellow; // 4xx
            if (status >= 500) color = colors.red; // 5xx
            
            const message = `${method} ${url} ${status} - ${duration}ms`;
            console.log(`${color}[HTTP] ${message}${colors.reset}`);
        });
        
        next();
    }
}

module.exports = Logger;

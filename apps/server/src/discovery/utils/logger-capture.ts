const originalLog = console.log;
const originalError = console.error;

const logsBuffer: string[] = [];
const LOG_LIMIT = 500;

export function addLogEntry(type: 'INFO' | 'ERROR', args: any[]) {
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ');
  const timestamp = new Date().toLocaleTimeString();
  const formatted = `[${timestamp}] [${type}] ${message}`;
  logsBuffer.push(formatted);
  if (logsBuffer.length > LOG_LIMIT) {
    logsBuffer.shift();
  }
}

export function getCapturedLogs(): string[] {
  return [...logsBuffer];
}

// Intercept console.log
console.log = function (...args: any[]) {
  addLogEntry('INFO', args);
  originalLog.apply(console, args);
};

// Intercept console.error
console.error = function (...args: any[]) {
  addLogEntry('ERROR', args);
  originalError.apply(console, args);
};

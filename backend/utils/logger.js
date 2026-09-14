function logInfo(message, data = null) {
  const timestamp = new Date().toISOString();

  if (data) {
    console.log(`[INFO] ${timestamp} - ${message}`, data);
  } else {
    console.log(`[INFO] ${timestamp} - ${message}`);
  }
}


function logError(message, error = null) {
  const timestamp = new Date().toISOString();

  console.error(`[ERROR] ${timestamp} - ${message}`);

  if (error) {
    console.error(error);
  }
}


function logWarning(message, data = null) {
  const timestamp = new Date().toISOString();

  if (data) {
    console.warn(`[WARNING] ${timestamp} - ${message}`, data);
  } else {
    console.warn(`[WARNING] ${timestamp} - ${message}`);
  }
}


module.exports = {
  logInfo,
  logError,
  logWarning
};
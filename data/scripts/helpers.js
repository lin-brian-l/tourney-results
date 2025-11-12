// Helper functions for command-line argument parsing

export function getArg(argName, defaultValue) {
  let value = defaultValue;

  process.argv.forEach(arg => {
    // Handle boolean flags like --verbose (no value = true)
    if (arg === `--${argName}`) {
      value = true;

      return value;
    }

    if (arg.startsWith(`--${argName}=`)) {
      const argValue = arg.split('=')[1];

      // Parse based on the type of defaultValue
      if (typeof defaultValue === 'boolean') {
        value = argValue === 'true';
      } else if (typeof defaultValue === 'number') {
        value = parseInt(argValue) || defaultValue;
      } else {
        value = argValue;
      }
    }
  });

  return value;
}

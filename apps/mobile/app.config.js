module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== "development") {
    return config;
  }

  return {
    ...config,
    name: "Relay-Dev",
    scheme: "relay-dev",
    android: {
      ...config.android,
      package: "com.prajwal17.relay.dev"
    },
    updates: {
      ...config.updates,
      enabled: false
    },
    plugins: config.plugins.filter((plugin) => plugin !== "./plugins/withAndroidReleaseSigning")
  };
};

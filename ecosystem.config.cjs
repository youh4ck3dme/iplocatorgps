module.exports = {
  apps: [
    {
      name: 'iplocatorgps',
      cwd: '/var/www/iplocatorgps',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p ' + (process.env.PORT || '9999'),
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

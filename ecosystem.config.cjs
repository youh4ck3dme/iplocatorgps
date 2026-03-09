module.exports = {
  apps: [
    {
      name: 'iplocatorgps',
      cwd: '/var/www/iplocatorgps',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 7676',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

module.exports = {
  apps: [{
    name: 'kiosk',
    script: 'npm',
    args: 'start',
    cwd: '/root/kiosk',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/kiosk/logs/err.log',
    out_file: '/root/kiosk/logs/out.log',
    log_file: '/root/kiosk/logs/combined.log',
    time: true
  }]
};
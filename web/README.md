# Linux Kernel Mechanisms Monitor

A beautiful, real-time web interface for monitoring Linux kernel mechanisms including Softirq, Tasklet, and Workqueue execution statistics.

## Features

🚀 **Real-time Monitoring**: Live updates of kernel mechanism statistics  
📊 **Interactive Charts**: Beautiful graphs showing call counts and latency  
🎨 **Modern UI**: Attractive dark theme with glassmorphism design  
📱 **Responsive**: Works on desktop, tablet, and mobile devices  
⚡ **Performance Comparison**: Side-by-side analysis of different mechanisms  
🔄 **Auto-fallback**: Demo mode when kernel module isn't loaded  

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Kernel Module │    │   Node.js Server │    │   Web Frontend  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │  Softirq    │ │    │ │   Express    │ │    │ │   Chart.js  │ │
│ │  Tasklet    │ ├────┤ │   API        │ ├────┤ │   Real-time │ │
│ │  Workqueue  │ │    │ │   /proc      │ │    │ │   Dashboard │ │
│ └─────────────┘ │    │ │   reader     │ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
     /proc/kernel_mechanisms      HTTP API           WebSocket-like
```

## Prerequisites

- **Linux system** (for kernel module)
- **Node.js** (version 14+)
- **npm** (Node Package Manager)
- **Kernel headers** (for building the module)

## Quick Start

### 1. Build and Load Kernel Module

```bash
# Navigate to kernel directory
cd ../kernel

# Build the kernel module
make

# Load the module (requires root privileges)
sudo insmod kernel_mechanisms.ko

# Verify module is loaded
lsmod | grep kernel_mechanisms

# Check proc file exists
cat /proc/kernel_mechanisms
```

### 2. Setup Web Interface

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start the server
npm start
```

### 3. Open Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main dashboard |
| `GET /api/stats` | Current kernel statistics (JSON) |
| `GET /api/info` | Server information |
| `GET /api/module-status` | Check kernel module status |
| `GET /api/health` | Health check |

## Development Mode

For development with auto-reload:

```bash
# Install development dependencies
npm install nodemon --save-dev

# Run in development mode
npm run dev
```

## Demo Mode

If the kernel module is not loaded, the application automatically switches to demo mode with simulated data that demonstrates the expected behavior and performance characteristics of each mechanism.

## Kernel Mechanisms Explained

### 🔥 Softirq (High Priority)
- **Context**: Interrupt context
- **Priority**: Highest
- **Latency**: ~45-60μs
- **Use Case**: Critical, time-sensitive operations
- **Characteristics**: Most consistent, fastest execution

### ⚡ Tasklet (Medium Priority)
- **Context**: Softirq context
- **Priority**: Medium
- **Latency**: ~75-125μs
- **Use Case**: Deferred interrupt handling
- **Characteristics**: Good balance of speed and flexibility

### 🔧 Workqueue (Process Context)
- **Context**: Process context
- **Priority**: Lowest
- **Latency**: ~180-260μs
- **Use Case**: Tasks that can sleep/block
- **Characteristics**: Most flexible, can access user space

## Performance Metrics

The dashboard displays several key metrics:

- **Call Count**: Total number of executions
- **Average Latency**: Mean execution time
- **Min/Max Latency**: Execution time range
- **Consistency**: Based on latency variance
- **Speed Comparison**: Relative performance

## Troubleshooting

### Kernel Module Issues

```bash
# Check if module is loaded
lsmod | grep kernel_mechanisms

# Check kernel logs
dmesg | grep km_mech

# Unload module
sudo rmmod kernel_mechanisms

# Reload module
sudo insmod kernel_mechanisms.ko
```

### Permission Issues

```bash
# Check proc file permissions
ls -la /proc/kernel_mechanisms

# If needed, adjust permissions (not recommended for production)
sudo chmod 644 /proc/kernel_mechanisms
```

### Server Issues

```bash
# Check if port is in use
netstat -tlnp | grep :3000

# Use different port
PORT=8080 npm start

# Check server logs
npm start 2>&1 | tee server.log
```

## Customization

### Change Update Interval

Edit `server.js`:
```javascript
const UPDATE_INTERVAL = 500; // 500ms instead of 1000ms
```

### Modify Chart Colors

Edit `script.js`:
```javascript
const chartColors = {
    softirq: '#your-color',
    tasklet: '#your-color',
    workqueue: '#your-color'
};
```

### Adjust Data History

Edit `script.js`:
```javascript
let maxDataPoints = 120; // Keep 2 minutes of data
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review server logs
- Verify kernel module status
- Ensure proper permissions

---

**Made with ❤️ for Linux kernel enthusiasts** 
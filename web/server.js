const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const PROC_FILE = '/proc/kernel_mechanisms';
const UPDATE_INTERVAL = 1000; // 1 second

// Store cached data
let cachedData = null;
let lastUpdateTime = 0;

// Serve static files
app.use(express.static(path.join(__dirname)));

// CORS middleware for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Read kernel mechanisms data from proc file
function readKernelData() {
    return new Promise((resolve, reject) => {
        fs.readFile(PROC_FILE, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading ${PROC_FILE}:`, err.message);
                
                // Return demo data if proc file is not available
                const demoData = generateDemoData();
                resolve(demoData);
                return;
            }

            try {
                // Parse the JSON data from the proc file
                const parsedData = JSON.parse(data.trim());
                console.log('Successfully read kernel data:', parsedData);
                resolve(parsedData);
            } catch (parseErr) {
                console.error('Error parsing JSON from proc file:', parseErr.message);
                console.log('Raw data:', data);
                
                // Fallback to demo data
                const demoData = generateDemoData();
                resolve(demoData);
            }
        });
    });
}

// Generate demo data for testing when kernel module is not loaded
function generateDemoData() {
    const now = Date.now();
    const baseTime = Math.floor(now / 1000);
    
    // Simulate realistic kernel mechanism behavior
    const softirqCalls = baseTime % 1000 + Math.floor(Math.random() * 50);
    const taskletCalls = baseTime % 800 + Math.floor(Math.random() * 40);
    const workqueueCalls = baseTime % 600 + Math.floor(Math.random() * 30);
    
    // Softirq: fastest, most consistent
    const softirqBaseLatency = 45000 + Math.random() * 15000; // 45-60μs
    
    // Tasklet: medium speed, more variance
    const taskletBaseLatency = 75000 + Math.random() * 50000; // 75-125μs
    
    // Workqueue: slowest, highest variance (process context)
    const workqueueBaseLatency = 180000 + Math.random() * 80000; // 180-260μs
    
    return {
        softirq: {
            calls: softirqCalls,
            avg_ns: Math.floor(softirqBaseLatency),
            min_ns: Math.floor(softirqBaseLatency * 0.85),
            max_ns: Math.floor(softirqBaseLatency * 1.2)
        },
        tasklet: {
            calls: taskletCalls,
            avg_ns: Math.floor(taskletBaseLatency),
            min_ns: Math.floor(taskletBaseLatency * 0.7),
            max_ns: Math.floor(taskletBaseLatency * 1.8)
        },
        workqueue: {
            calls: workqueueCalls,
            avg_ns: Math.floor(workqueueBaseLatency),
            min_ns: Math.floor(workqueueBaseLatency * 0.9),
            max_ns: Math.floor(workqueueBaseLatency * 1.4)
        }
    };
}

// Cache management
function shouldUpdateCache() {
    const now = Date.now();
    return !cachedData || (now - lastUpdateTime) > UPDATE_INTERVAL;
}

// API endpoint to get current statistics
app.get('/api/stats', async (req, res) => {
    try {
        if (shouldUpdateCache()) {
            cachedData = await readKernelData();
            lastUpdateTime = Date.now();
        }
        
        res.json(cachedData);
    } catch (error) {
        console.error('Error in /api/stats:', error);
        res.status(500).json({ 
            error: 'Failed to read kernel data', 
            details: error.message 
        });
    }
});

// API endpoint to get system information
app.get('/api/info', (req, res) => {
    const info = {
        server: 'Linux Kernel Mechanisms Monitor',
        version: '1.0.0',
        procFile: PROC_FILE,
        procFileExists: fs.existsSync(PROC_FILE),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
    };
    
    res.json(info);
});

// API endpoint to test kernel module status
app.get('/api/module-status', async (req, res) => {
    try {
        // Check if proc file exists
        const procExists = fs.existsSync(PROC_FILE);
        
        if (!procExists) {
            res.json({
                status: 'not_loaded',
                message: 'Kernel module not loaded',
                procFile: PROC_FILE,
                suggestion: 'Load the kernel module using: sudo insmod kernel_mechanisms.ko'
            });
            return;
        }
        
        // Try to read the proc file
        const data = await readKernelData();
        res.json({
            status: 'loaded',
            message: 'Kernel module is loaded and accessible',
            procFile: PROC_FILE,
            sampleData: data
        });
        
    } catch (error) {
        res.json({
            status: 'error',
            message: 'Error checking module status',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint - serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found', 
        message: `Route ${req.path} not found` 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error', 
        message: err.message 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Linux Kernel Mechanisms Monitor Server started on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/stats`);
    console.log(`🔍 Module Status: http://localhost:${PORT}/api/module-status`);
    console.log(`📁 Monitoring proc file: ${PROC_FILE}`);
    
    // Check initial module status
    const procExists = fs.existsSync(PROC_FILE);
    if (procExists) {
        console.log('✅ Kernel module detected - real data available');
    } else {
        console.log('⚠️  Kernel module not detected - demo data will be used');
        console.log('   To load the module: cd ../kernel && sudo make && sudo insmod kernel_mechanisms.ko');
    }
    
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    process.exit(0);
}); 
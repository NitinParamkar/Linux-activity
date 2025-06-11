// Global variables
let callsChart, latencyChart;
let isConnected = false;
let isPaused = false;
let dataHistory = {
    softirq: [],
    tasklet: [],
    workqueue: []
};
let maxDataPoints = 60; // Keep last 60 data points (1 minute at 1s intervals)

// Chart colors
const chartColors = {
    softirq: '#ff6b6b',
    tasklet: '#4ecdc4',
    workqueue: '#45b7d1'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    setupEventListeners();
    startDataFetching();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resetBtn').addEventListener('click', resetCharts);
}

// Initialize Chart.js charts
function initializeCharts() {
    // Calls Chart
    const callsCtx = document.getElementById('callsChart').getContext('2d');
    callsChart = new Chart(callsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Softirq',
                    data: [],
                    borderColor: chartColors.softirq,
                    backgroundColor: chartColors.softirq + '20',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Tasklet',
                    data: [],
                    borderColor: chartColors.tasklet,
                    backgroundColor: chartColors.tasklet + '20',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Workqueue',
                    data: [],
                    borderColor: chartColors.workqueue,
                    backgroundColor: chartColors.workqueue + '20',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e6ed',
                        usePointStyle: true
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#e0e6ed' },
                    grid: { color: 'rgba(224, 230, 237, 0.1)' }
                },
                y: {
                    ticks: { color: '#e0e6ed' },
                    grid: { color: 'rgba(224, 230, 237, 0.1)' },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });

    // Latency Chart
    const latencyCtx = document.getElementById('latencyChart').getContext('2d');
    latencyChart = new Chart(latencyCtx, {
        type: 'bar',
        data: {
            labels: ['Softirq', 'Tasklet', 'Workqueue'],
            datasets: [{
                label: 'Average Latency (ns)',
                data: [0, 0, 0],
                backgroundColor: [
                    chartColors.softirq + '80',
                    chartColors.tasklet + '80',
                    chartColors.workqueue + '80'
                ],
                borderColor: [
                    chartColors.softirq,
                    chartColors.tasklet,
                    chartColors.workqueue
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: { color: '#e0e6ed' },
                    grid: { display: false }
                },
                y: {
                    ticks: { 
                        color: '#e0e6ed',
                        callback: function(value) {
                            return formatLatency(value);
                        }
                    },
                    grid: { color: 'rgba(224, 230, 237, 0.1)' },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Start fetching data from server
function startDataFetching() {
    fetchData();
    setInterval(() => {
        if (!isPaused) {
            fetchData();
        }
    }, 1000); // Fetch every second
}

// Fetch data from server
async function fetchData() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        updateConnection(true);
        updateUI(data);
        updateCharts(data);
        updateComparisons(data);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        updateConnection(false);
        
        // Show demo data when server is not available
        const demoData = generateDemoData();
        updateUI(demoData);
        updateCharts(demoData);
        updateComparisons(demoData);
    }
}

// Generate demo data for testing
function generateDemoData() {
    const now = Date.now();
    const baseLatency = {
        softirq: 50000 + Math.random() * 10000,
        tasklet: 80000 + Math.random() * 30000,
        workqueue: 200000 + Math.random() * 50000
    };
    
    return {
        softirq: {
            calls: Math.floor(now / 10000) + Math.floor(Math.random() * 10),
            avg_ns: Math.floor(baseLatency.softirq),
            min_ns: Math.floor(baseLatency.softirq * 0.8),
            max_ns: Math.floor(baseLatency.softirq * 1.5)
        },
        tasklet: {
            calls: Math.floor(now / 10000) + Math.floor(Math.random() * 8),
            avg_ns: Math.floor(baseLatency.tasklet),
            min_ns: Math.floor(baseLatency.tasklet * 0.7),
            max_ns: Math.floor(baseLatency.tasklet * 2.0)
        },
        workqueue: {
            calls: Math.floor(now / 10000) + Math.floor(Math.random() * 5),
            avg_ns: Math.floor(baseLatency.workqueue),
            min_ns: Math.floor(baseLatency.workqueue * 0.9),
            max_ns: Math.floor(baseLatency.workqueue * 1.3)
        }
    };
}

// Update connection status
function updateConnection(connected) {
    isConnected = connected;
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Demo Mode';
    }
}

// Update UI elements with new data
function updateUI(data) {
    // Update Softirq stats
    updateStatCard('softirq', data.softirq);
    
    // Update Tasklet stats
    updateStatCard('tasklet', data.tasklet);
    
    // Update Workqueue stats
    updateStatCard('workqueue', data.workqueue);
}

// Update individual stat card
function updateStatCard(type, stats) {
    const prefix = type;
    
    // Animate number changes
    animateValue(`${prefix}Calls`, stats.calls);
    
    document.getElementById(`${prefix}Avg`).textContent = formatLatency(stats.avg_ns);
    document.getElementById(`${prefix}Min`).textContent = formatLatency(stats.min_ns);
    document.getElementById(`${prefix}Max`).textContent = formatLatency(stats.max_ns);
}

// Animate value changes
function animateValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const difference = newValue - currentValue;
    const steps = 20;
    const stepValue = difference / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
        currentStep++;
        const value = Math.round(currentValue + (stepValue * currentStep));
        element.textContent = value;
        
        if (currentStep >= steps) {
            clearInterval(timer);
            element.textContent = newValue;
        }
    }, 30);
}

// Update charts with new data
function updateCharts(data) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    
    // Update data history
    dataHistory.softirq.push({ time: timeLabel, calls: data.softirq.calls, latency: data.softirq.avg_ns });
    dataHistory.tasklet.push({ time: timeLabel, calls: data.tasklet.calls, latency: data.tasklet.avg_ns });
    dataHistory.workqueue.push({ time: timeLabel, calls: data.workqueue.calls, latency: data.workqueue.avg_ns });
    
    // Keep only last maxDataPoints
    Object.keys(dataHistory).forEach(key => {
        if (dataHistory[key].length > maxDataPoints) {
            dataHistory[key] = dataHistory[key].slice(-maxDataPoints);
        }
    });
    
    // Update calls chart
    callsChart.data.labels = dataHistory.softirq.map(d => d.time);
    callsChart.data.datasets[0].data = dataHistory.softirq.map(d => d.calls);
    callsChart.data.datasets[1].data = dataHistory.tasklet.map(d => d.calls);
    callsChart.data.datasets[2].data = dataHistory.workqueue.map(d => d.calls);
    callsChart.update('none');
    
    // Update latency chart
    latencyChart.data.datasets[0].data = [
        data.softirq.avg_ns,
        data.tasklet.avg_ns,
        data.workqueue.avg_ns
    ];
    latencyChart.update('none');
}

// Update comparison sections
function updateComparisons(data) {
    // Update speed comparison (inverse of latency)
    const maxLatency = Math.max(data.softirq.avg_ns, data.tasklet.avg_ns, data.workqueue.avg_ns);
    
    updateProgressBar('softirqSpeed', ((maxLatency - data.softirq.avg_ns) / maxLatency) * 100);
    updateProgressBar('taskletSpeed', ((maxLatency - data.tasklet.avg_ns) / maxLatency) * 100);
    updateProgressBar('workqueueSpeed', ((maxLatency - data.workqueue.avg_ns) / maxLatency) * 100);
    
    // Update consistency meters (based on variance)
    updateConsistencyMeter('softirqMeter', calculateConsistency(data.softirq));
    updateConsistencyMeter('taskletMeter', calculateConsistency(data.tasklet));
    updateConsistencyMeter('workqueueMeter', calculateConsistency(data.workqueue));
}

// Update progress bar width
function updateProgressBar(elementId, percentage) {
    const element = document.getElementById(elementId);
    element.style.width = Math.max(10, percentage) + '%';
}

// Update consistency meter
function updateConsistencyMeter(elementId, percentage) {
    const element = document.getElementById(elementId);
    const valueElement = element.querySelector('.meter-value');
    valueElement.textContent = Math.round(percentage) + '%';
    
    // Update color based on percentage
    if (percentage >= 90) {
        valueElement.style.borderColor = '#4caf50';
        valueElement.style.color = '#4caf50';
    } else if (percentage >= 70) {
        valueElement.style.borderColor = '#ff9800';
        valueElement.style.color = '#ff9800';
    } else {
        valueElement.style.borderColor = '#f44336';
        valueElement.style.color = '#f44336';
    }
}

// Calculate consistency based on min/max variance
function calculateConsistency(stats) {
    if (stats.avg_ns === 0) return 0;
    
    const variance = ((stats.max_ns - stats.min_ns) / stats.avg_ns) * 100;
    return Math.max(0, 100 - variance);
}

// Format latency values
function formatLatency(ns) {
    if (ns === 0) return '0 ns';
    if (ns < 1000) return ns + ' ns';
    if (ns < 1000000) return (ns / 1000).toFixed(1) + ' μs';
    return (ns / 1000000).toFixed(1) + ' ms';
}

// Toggle pause/resume
function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    const icon = btn.querySelector('i');
    
    if (isPaused) {
        icon.className = 'fas fa-play';
        btn.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
        icon.className = 'fas fa-pause';
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
}

// Reset charts
function resetCharts() {
    dataHistory = {
        softirq: [],
        tasklet: [],
        workqueue: []
    };
    
    callsChart.data.labels = [];
    callsChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });
    callsChart.update();
    
    latencyChart.data.datasets[0].data = [0, 0, 0];
    latencyChart.update();
}

// Add some visual effects
function addVisualEffects() {
    // Add floating particles effect
    const container = document.querySelector('.container');
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: fixed;
            width: 2px;
            height: 2px;
            background: rgba(100, 255, 218, 0.3);
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            animation: float ${5 + Math.random() * 10}s infinite linear;
        `;
        document.body.appendChild(particle);
    }
}

// Add floating animation
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-10vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize visual effects
setTimeout(addVisualEffects, 1000); 
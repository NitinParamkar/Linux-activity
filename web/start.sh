#!/bin/bash

# Linux Kernel Mechanisms Monitor - Quick Start Script
# This script helps set up and start the web interface

echo "🚀 Linux Kernel Mechanisms Monitor - Quick Start"
echo "================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check for npm
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 14 ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Version 14+ recommended."
fi

echo "✅ Node.js $(node --version) detected"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check kernel module status
echo ""
echo "🔍 Checking kernel module status..."

if [ -f "/proc/kernel_mechanisms" ]; then
    echo "✅ Kernel module is loaded and accessible"
    echo "📊 Sample data:"
    head -n 3 /proc/kernel_mechanisms
else
    echo "⚠️  Kernel module not detected"
    echo "   The web interface will run in demo mode"
    echo ""
    echo "💡 To load the real kernel module:"
    echo "   cd ../kernel"
    echo "   make"
    echo "   sudo insmod kernel_mechanisms.ko"
fi

echo ""
echo "🌐 Starting web server..."
echo "📊 Dashboard will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start 
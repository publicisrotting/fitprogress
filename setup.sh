#!/bin/bash

echo "=========================================="
echo "      FitProgress Setup Script"
echo "=========================================="
echo ""
echo "Installing Root dependencies..."
npm install

echo ""
echo "Installing Server dependencies..."
cd server
npm install
cd ..

echo ""
echo "Installing Mobile dependencies..."
cd mobile
npm install
cd ..

echo ""
echo "=========================================="
echo "      Installation Complete!"
echo "=========================================="

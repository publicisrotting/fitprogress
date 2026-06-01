#!/bin/bash

echo "Stopping all Node.js processes..."
# Check if node processes exist before killing to avoid error message
if pgrep node > /dev/null; then
    killall node
    echo "Node processes stopped."
else
    echo "No Node processes found."
fi

echo ""
echo "Done. You can now run start.sh again."

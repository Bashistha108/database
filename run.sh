#!/bin/bash

# Function to handle termination
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM to run the cleanup function
trap cleanup INT TERM

echo "🚀 Starting Backend (Spring Boot)..."
cd backend
./mvnw spring-boot:run &
BACKEND_PID=$!

echo "🚀 Starting Frontend (Vite/React)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both services are starting up!"
echo "   Backend will run on: http://localhost:8080"
echo "   Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services."
echo ""

# Wait for both processes to finish (which won't happen unless stopped)
wait

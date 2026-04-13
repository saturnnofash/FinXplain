SUPERUSER PASSWORD: password

#input assumptions changed

IF cannot run backend server:
# 1. Find the PID using port 8000
netstat -ano | findstr ":8000"
# 2. Kill it (replace 12345 with the actual PID)
taskkill /PID 12345 /F

# run backend
# Run from SP2/ directory
python -m uvicorn backend.main:app --reload --port 8000

# run frontend
cd frontend
npm run dev
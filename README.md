# Attendance Tracking System 📋

A modern attendance tracking application built with React and Node.js that automatically manages user attendance status through scheduled tasks.

<!-- Method 1: Simple markdown syntax -->
![Video Demo](screenshot2.mov)

<!-- Method 2: HTML video tag (recommended for more control) -->
<video autoplay loop muted playsinline>
  <source src="screenshot2.mov" type="video/mp4">
</video>

## Features ✨

- **Real-time Attendance Tracking**: Mark attendance as 'Present' or 'Absent' with a single click
- **Automatic Status Updates**: Uses cron jobs to automatically mark users as 'Absent' if no status is recorded by end of day
- **User Dashboard**: Visualize attendance for all subjects together
- **Mobile Responsive**: Fully functional on all device sizes
- **Secure Authentication**: JWT-based authentication system

## Tech Stack 🛠

- **Frontend**: React.js, Redux, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Infrastructure**: AWS EC2
- **Network**: Cloudflare for DNS and SSL
- **Scheduling**: node-cron for automated tasks

## Installation 🚀

1. Clone the repository:
```bash
git clone https://github.com/vaibhxv/AttendanceTracker.git
cd AttendanceTracker
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd api
npm install

# Install frontend dependencies
cd client
npm install
```

3. Set up environment variables:
```bash
# Backend .env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# Frontend .env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development servers:
```bash
# Start backend
cd api
npm start

# Start frontend (in a new terminal)
cd client
npm run dev
```


## Automated Tasks ⚡

The system uses node-cron to schedule automatic attendance updates:

```javascript
cron.schedule('0 0 * * *', async () => {
  // Mark unmarked attendances as 'Absent'
  await markAbsentForUnmarkedAttendances();
}, {
  timezone: "UTC"
});
```

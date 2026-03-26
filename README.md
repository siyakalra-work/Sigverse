# EduVerse

Full-stack course enrollment and learning progress platform with:

- `backend/`: Express + MySQL + MongoDB + GitHub OAuth
- `frontend/`: React + Vite

This README covers the commands needed to install, run, seed, and test the complete project.

Unless stated otherwise, run commands from the project root folder.

## Prerequisites

- Node.js `20+`
- npm
- MySQL running on `localhost:3306`
- MongoDB running on `localhost:27017`
- A GitHub OAuth app with callback URL:

```text
http://localhost:5000/auth/github/callback
```

## Project Ports

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

Keep the frontend on port `5173` because the backend OAuth redirect expects that URL.

## 1. Start Database Services

If you installed MySQL and MongoDB with Homebrew on macOS, use:

```bash
brew services start mysql
brew services start mongodb-community
```

If you use a different setup, just make sure:

- MySQL is running on `localhost:3306`
- MongoDB is running on `mongodb://localhost:27017`

## 2. Configure Environment Variables

Open the backend environment file:

```bash
cd backend
nano .env
```

Use values like this:

```env
PORT=5000
NODE_ENV=development

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=edtech_db

MONGO_URI=mongodb://localhost:27017/edtech_logs

JWT_SECRET=your_long_random_secret_key
JWT_EXPIRES_IN=7d

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

FRONTEND_URL=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Save and exit:

- `Ctrl + O`
- `Enter`
- `Ctrl + X`

## 3. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## 4. Create the MySQL Database and Base Tables

Run the schema file from the backend folder:

```bash
cd backend
mysql -u root -p < schema.sql
```

This creates:

- database `edtech_db`
- all tables
- minimal starter data

## 5. Optional: Load Full Sample Data

To populate the project with larger demo data for courses, modules, lessons, enrollments, progress, and logs:

```bash
cd backend
npm run seed:sample
```

Use this if you want the UI to look fully populated.

## 6. Run the Backend

Open terminal 1:

```bash
cd backend
npm run dev
```

Useful backend check:

```bash
curl http://localhost:5000/health
```

## 7. Run the Frontend

Open terminal 2:

```bash
cd frontend
npm run dev -- --port 5173
```

Open the app:

```bash
open http://localhost:5173
```

If `open` does not work on your system, open the URL manually in your browser.

## 8. Login Flow

This project uses GitHub login only.

Login flow:

1. Open `http://localhost:5173/login`
2. Click the GitHub login button
3. Complete GitHub OAuth
4. You will be redirected back to the frontend

Important:

- a brand-new GitHub login is created as `learner` by default
- if you change a user's role in MySQL, log out and log in again so a fresh JWT is created

## 9. Test Role-Based Access

Check current users:

```bash
mysql -u root -p -e "USE edtech_db; SELECT id,name,email,role,github_id FROM users;"
```

Make your GitHub user an instructor:

```bash
mysql -u root -p -e "USE edtech_db; UPDATE users SET role='instructor' WHERE email='your_github_email@example.com';"
```

Make your GitHub user an admin:

```bash
mysql -u root -p -e "USE edtech_db; UPDATE users SET role='admin' WHERE email='your_github_email@example.com';"
```

Then log out and log in again.

## Quick Start Commands

Use these in order from scratch.

Terminal 1:

```bash
brew services start mysql
brew services start mongodb-community
cd backend
npm install
mysql -u root -p < schema.sql
npm run seed:sample
npm run dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev -- --port 5173
open http://localhost:5173
```

## Useful Commands

Backend:

```bash
cd backend
npm run dev
npm start
npm run seed:sample
```

Frontend:

```bash
cd frontend
npm run dev -- --port 5173
npm run build
npm run preview
```

## Troubleshooting

### GitHub login fails

Check:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback`
- your GitHub OAuth app callback URL matches exactly

### Courses or dashboard show no data

Run:

```bash
cd backend
npm run seed:sample
```

### Instructor or admin pages do not open

Your account role is probably still `learner`, or you changed the role without logging in again.

## Folder Structure

```text
backend/
  app.js
  server.js
  schema.sql
  package.json

frontend/
  package.json
  src/
```

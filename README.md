Purpose, Scope, and Objectives of The Project:
The goal of this project was to build a website for Orange Frog Productions that makes it easier for freelance lighting technicians to find and apply for jobs alongside additional functions such as generating their invoices and creating correction reports to requests to amend information about their job during events. The website will also help admins manage users and events. Admins can add or remove freelancers, create events, and keep track of work hours and payments. Freelancers will be able to see available events and sign up for them. The project will be completed by May 2025.

Technology stack:
Languages:
- Java Script
Frameworks:
- React.js
- Node.js
- Tailwind CSS
- Express
- mongoose
- dotenv
- bcrypt

Running The Project Locally:
1. In a command terminal open both the client and server folders
2. In client folder create a .env file with the var "REACT_APP_BACKEND" giving the value of the localhost such as "http://localhost:4000"
3. In client folder create a .env file with following vars and update to match your user information for each: 
    - ADMIN_EMAIL=
    - ADMIN_PASSWORD=
    - MONGO_USERNAME=
    - MONGO_PASSWORD=
    - EMAIL_USERNAME=
    - EMAIL_PASSWORD=
    - PORT=
    - JWT_SECRET = 
4. Run npm install in both folders
5. Run npm start in both folder to properly start project

Deployment Instructions:
1. Create a repo of the project on github
2. Create a deployment of the project using https://vercel.com/

Issues:
- Users can easily bypass login if they have valid JWT token of another user or admin and paste as their own, it allows them to access unintended areas of the site
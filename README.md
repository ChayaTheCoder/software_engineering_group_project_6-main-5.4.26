# software_engineering_group_project_6-main-5.4.26
# Photo App  


---

## Overview
This project implements a **photo‑sharing web application** using **Node.js**, **Express**, and **MongoDB**. It builds on previous assignments by replacing static model data with a persistent database and RESTful API endpoints. The app supports user profiles, photo collections, and comment functionality.

---

## Technologies
- **Frontend:** React JS  
- **Backend:** Node.js + Express  
- **Database:** MongoDB + Mongoose ODL  
- **Libraries:** Axios, Async, Nodemon, Webpack, Babel, ESLint  

---

## Directory Structure
PhotoApp/
── backend/
│   ├── webServer.js
│   ├── loadDatabase.js
│   ├── schema/
│   │   ├── user.js
│   │   ├── photo.js
│   │   └── schemaInfo.js
│   └── modelData/
│       └── photoApp.js


── frontend/
│   ├── components/
│   ├── styles/
│   ├── images/
│   └── photoShare.jsx
├── package.json
├── webpack.config.js
└── README.md



---

## MongoDB Integration
The app loads fake model data from previous projects into MongoDB using `loadDatabase.js`.  
- Run once to populate the database.  
- Safe to rerun — it clears existing data before reloading.  
- Uses Mongoose schemas for Users, Photos, and SchemaInfo.


---

## Schema Definitions
- **user.js** — Defines the User collection.  
- **photo.js** — Defines Photos and embedded Comments.  
- **schemaInfo.js** — Defines SchemaInfo for version tracking.  

These schemas are imported by both `loadDatabase.js` and `webServer.js`.

---

## Running the App
1. Install dependencies:  
   ```bash
   npm install
Start MongoDB locally.

Load the database:

bash
node loadDatabase.js
Start the server:

bash
node webServer.js
Launch the frontend:

bash
npm start
# Learning Outcomes
Implemented RESTful APIs with Express and Mongoose.

Integrated MongoDB schemas and data persistence.

Practiced modular backend design and frontend data fetching.

Strengthened collaboration through version control and code review.
# Photo App Scrum Team
https://docs.google.com/document/d/1Fpc5SG9WfFMGxecoT88M2Tt-ffb9Todi6WZ_uIyvmIk/edit?usp=sharing 
## Product Owner
ITSC-3155

## Scrum Manager
Lew Price

## Developers
- Michaya Mohamed
- Ana Jackson
- Caden Medlin

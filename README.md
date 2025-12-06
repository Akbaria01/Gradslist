# Gradslist

Gradslist is a refined, online marketplace built by Team Grad (UNCC seniors). It resembles sites like Craigslist but provides a modern, intuitive experience with features commonly expected from today's web and mobile marketplaces.

Team
- Team Grad — UNCC Seniors
  - Moeez: mawan@uncc.edu
  - Clariza: clopezr2@charlotte.edu
  - Toe: treh@charlotte.edu
  - Ahmad: aakbari1@charlotte.edu
  - Mariela: mespina1@charlotte.edu
  - Tyler: tniemone@charlotte.edu

Project Overview
----------------
Gradslist is a full-stack single-page application built with React and Tailwind CSS on the frontend and Firebase (Firestore, Auth, Storage) on the backend. The app enables students to create, browse, and manage classified listings with additional convenience and safety features:

- User profiles (display name, ratings, profile pic, contact)
- Create / Read / Update / Delete (CRUD) listings
- Static In-app messaging for buyer/seller communication
- Static Recommended meetup locations section
- Google sign-in for quick authentication
- Image uploads (Firebase Storage)
- Responsive UI with modern design patterns and predictable UX

Live Demo
---------
The app is deployed at: https://gradslist.web.app/

Run locally
-----------
1. Clone the repository:

	git clone <https://github.com/Akbaria01/Gradslist.git>
	cd Gradslist

2. Install dependencies:

	npm install

3. Start the dev server:

	npm run dev

4. Running the command will open http://localhost:5173 in your browser and you can interact with the appplication.

Notes about authentication and uploads
------------------------------------
- The app supports Google sign-in via Firebase Auth. To enable Google login locally you will need to configure Firebase credentials in `src/firebase.js` and enable Google sign-in in your Firebase console.
- Image uploads use Firebase Storage. If images fail to upload from the browser, ensure the `storageBucket` in your Firebase config is correct (e.g., `gradslist.appspot.com`) and that the bucket has an appropriate CORS configuration. A `cors.json` file is included in this repo with an example policy.

Development notes
-----------------
- The frontend is built with React and Tailwind CSS (see `tailwind.config.js`).
- Maps and Places features use the Google Maps/Places APIs (API key required in the environment for some features).
- Firestore is used for data persistence; listings are stored under the `listings` collection and users under `users`.

Contributing
------------
If you plan to contribute or run this project locally, please:

1. Make sure you have Node.js and npm installed.
2. Optional: Create a Firebase project and copy your client config into `src/firebase.js` (keep credentials out of version control).
3. Optional: add a `serviceAccountKey.json` to `scripts/` if you intend to run admin scripts locally (not required for the client app).

License
-------
This project is for academic purposes (UNCC - Team Grad). Check with the team maintainers for permission before using the code in production.

Contact
-------
For questions about the project, reach out to any Team Grad member listed above.

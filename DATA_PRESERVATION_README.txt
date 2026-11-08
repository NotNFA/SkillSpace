SkillSpace DATA PRESERVATION

This package includes your existing creatrhub.db and extracted uploads/ folder.
Keep creatrhub.db and uploads/ in this same project folder. The server uses creatrhub.db by default and stores new project ZIP submissions under uploads/project-submissions/.

Do not delete, rename, or overwrite creatrhub.db or uploads/. Back up BOTH together before replacing/updating the project folder.
The existing database was migrated additively for this version; existing users and project records were retained.
For local setup: run npm install, then npm start.

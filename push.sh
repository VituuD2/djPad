#!/bin/bash
# Helper script to sync changes to GitHub
git add .
git commit -m "Update from Firebase Studio"
# Try to add remote, if it exists, update the URL
git remote add origin https://github.com/VituuD2/dj-pad.git 2>/dev/null || git remote set-url origin https://github.com/VituuD2/dj-pad.git
git push -u origin main

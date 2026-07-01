@echo off
echo Cleaning Hackathon data from Database...
docker exec -i seal-hms-postgres psql -U postgres -d seal_hms -c "TRUNCATE TABLE event CASCADE;"
echo Database cleaned! You can now create a new Event.

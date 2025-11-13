#!/bin/bash
set -e

# Function to wait for PostgreSQL database
wait_for_postgres() {
if [ -n "$DATABASE_URL" ]; then
echo "Waiting for PostgreSQL database..."
# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/dbname
while ! python -c "
import sys
import os
from urllib.parse import urlparse
try:
import psycopg2
db_url = os.environ.get('DATABASE_URL')
if db_url:
parsed = urlparse(db_url)
conn = psycopg2.connect(
dbname=parsed.path.lstrip('/'),
user=parsed.username,
password=parsed.password,
host=parsed.hostname,
port=parsed.port or 5432
)
conn.close()
sys.exit(0)
except Exception as e:
sys.exit(1)
" 2>/dev/null; do
echo "Database is unavailable - sleeping"
sleep 1
done
echo "Database is up!"
else
echo "No DATABASE_URL set, using SQLite (if configured)"
fi
}

# Wait for database if using PostgreSQL
wait_for_postgres

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files (if needed)
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Execute the main command
exec "$@"
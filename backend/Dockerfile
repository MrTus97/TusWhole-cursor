# Backend Dockerfile - Production
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Install gunicorn for production
RUN pip install --no-cache-dir gunicorn

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Run migrations and start server with gunicorn
CMD ["gunicorn", "TusWhole.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]


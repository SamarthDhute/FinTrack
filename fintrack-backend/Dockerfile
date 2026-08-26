# fintrack-backend/Dockerfile
# Use official Python slim image
FROM python:3.12-slim

# Set workdir
WORKDIR /app

# Install OS deps needed for psycopg (binary wheels already include libpq, but keep build tools for safety)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose FastAPI port (default 8000)
EXPOSE 8000

# Run database migrations and start application
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

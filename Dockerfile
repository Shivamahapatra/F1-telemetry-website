FROM python:3.11-slim

# Install system dependencies (build-essential for signalr-client-aio compilation if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY live_streamer.py .

# Expose port (Render overrides this with $PORT anyway)
EXPOSE 8765

ENV PYTHONUNBUFFERED=1

CMD ["python", "live_streamer.py"]

FROM oven/bun:1 as base

WORKDIR /app

# System deps for EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    libglib2.0-0 libsm6 libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Setup Python venv and install OCR deps
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:${PATH}"

COPY ocr-service/requirements.txt /app/python-requirements.txt
RUN pip install --no-cache-dir -r /app/python-requirements.txt

# Install Node/Bun deps
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile

# Copy src and python scripts
COPY src ./src
COPY public ./public
COPY drizzle ./drizzle
COPY ocr-service/app/cli.py ./python/ocr_cli.py

ENV PYTHON_BIN=/app/venv/bin/python3 \
    PYTHON_OCR_SCRIPT=/app/python/ocr_cli.py

EXPOSE 3000
EXPOSE 3001

CMD ["bun", "run", "dev"]



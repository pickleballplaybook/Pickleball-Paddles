FROM node:20-bookworm-slim

# System deps: ffmpeg, deno, fonts for video text overlay, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    fontconfig \
    fonts-dejavu-core \
    unzip \
  && rm -rf /var/lib/apt/lists/*

# Install Deno (yt-dlp uses it for JS challenge solving)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

WORKDIR /app

# Install Node deps
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy source
COPY . .

# Download latest nightly yt-dlp binary
RUN curl -L -o /usr/local/bin/yt-dlp \
    https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp_linux \
  && chmod +x /usr/local/bin/yt-dlp \
  && yt-dlp --version

ENV PORT=8080
ENV YTDLP_BIN=/usr/local/bin/yt-dlp

EXPOSE 8080

CMD ["node", "server.js"]

# Stage 1: Builder
FROM node:20-alpine AS builder

# Declare build-time arguments early - ADD THE MISSING SUPABASE VARIABLES
ARG NEXT_PUBLIC_PROJECT_ID
ARG NEXT_PUBLIC_HELIUS_API_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_RESEND_API_KEY
ARG NEXT_PUBLIC_TREASURY_ADDRESS
ARG NEXT_PUBLIC_OPENAI_API_KEY

# Install system dependencies
RUN apk add --no-cache python3 make g++ linux-headers git && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    npm install -g pnpm@9

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies including devDependencies
RUN pnpm install --ignore-scripts --strict-peer-dependencies=false

# Install required Solana dependencies (optional if already in package.json)
RUN pnpm add \
    pino-pretty \
    @solana/wallet-adapter-base \
    @solana/web3.js \
    @solana/wallet-adapter-react \
    @solana/wallet-adapter-wallets \
    @solana/wallet-adapter-react-ui

# Copy all source files
COPY . .

# Build the project - ADD THE MISSING SUPABASE VARIABLES
RUN NEXT_PUBLIC_PROJECT_ID=${NEXT_PUBLIC_PROJECT_ID} \
    NEXT_PUBLIC_HELIUS_API_KEY=${NEXT_PUBLIC_HELIUS_API_KEY} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_RESEND_API_KEY=${NEXT_PUBLIC_RESEND_API_KEY} \
    NEXT_PUBLIC_TREASURY_ADDRESS=${NEXT_PUBLIC_TREASURY_ADDRESS} \
    NEXT_PUBLIC_OPENAI_API_KEY=${NEXT_PUBLIC_OPENAI_API_KEY} \
    pnpm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@9

# Copy production build output
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/package.json ./package.json

# Switch to non-root user
USER node

# Runtime config
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Runtime environment variables - ADD THE MISSING SUPABASE VARIABLES
ENV NEXT_PUBLIC_PROJECT_ID=""
ENV NEXT_PUBLIC_HELIUS_API_KEY=""
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV NEXT_PUBLIC_RESEND_API_KEY=""
ENV NEXT_PUBLIC_TREASURY_ADDRESS=""
ENV NEXT_PUBLIC_OPENAI_API_KEY=""

EXPOSE 3000
CMD ["pnpm", "start"]
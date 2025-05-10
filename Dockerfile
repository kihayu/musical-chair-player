# Stage 1: Build the Vue.js application
FROM oven/bun:1 as builder

WORKDIR /app

# Copy package.json and bun.lock first to leverage Docker cache
COPY package.json bun.lock ./

# Install dependencies
# Using --frozen-lockfile ensures that the exact versions specified in bun.lock are installed.
RUN bun install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine as server

# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
# We will create this nginx.conf file next
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default HTTP port)
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]

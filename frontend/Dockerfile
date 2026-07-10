# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (improves caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set Vite build argument and environment variable for API URL
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the production bundle
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy built assets from build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx server block configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for traffic
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

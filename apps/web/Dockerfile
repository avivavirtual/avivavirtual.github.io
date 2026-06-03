FROM node:20-alpine

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN npm ci --workspace=apps/web --workspace=packages/shared --workspace=packages/ui --workspace=packages/config --no-audit --no-fund --prefer-offline
COPY . .
RUN npm run build --workspace=apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]

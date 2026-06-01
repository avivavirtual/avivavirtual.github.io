FROM node:20-alpine
WORKDIR /app

COPY package.json turbo.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspace @avivavirtual/web --include-workspace-root
RUN npm run build --workspace @avivavirtual/shared && npm run build --workspace @avivavirtual/ui

COPY apps/web ./apps/web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "dev"]

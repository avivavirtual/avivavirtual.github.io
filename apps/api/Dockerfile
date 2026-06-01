FROM node:20-alpine
WORKDIR /app

COPY package.json turbo.json ./
COPY packages ./packages
COPY prisma ./prisma
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspace @avivavirtual/api --include-workspace-root

COPY apps/api ./apps/api
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["npm", "run", "dev"]

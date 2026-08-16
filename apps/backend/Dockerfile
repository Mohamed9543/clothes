FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
COPY package.json ./
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]

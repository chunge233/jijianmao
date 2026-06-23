FROM node:22-alpine AS deps

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci

FROM deps AS build

COPY server/ ./
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app/server
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/package*.json ./
COPY --from=build /app/server/prisma ./prisma

RUN mkdir -p /app/server/data

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]

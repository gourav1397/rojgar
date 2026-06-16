FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages packages
RUN npm install

FROM deps AS build
COPY . .
RUN npm run build --workspace apps/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/packages packages
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]

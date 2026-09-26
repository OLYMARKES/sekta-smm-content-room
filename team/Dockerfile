FROM node:22-bookworm-slim AS dependencies
WORKDIR /source
COPY . .
WORKDIR /source/team
RUN npm ci --no-audit --no-fund
RUN node scripts/sync-editor.mjs

FROM dependencies AS build
RUN BETTER_AUTH_URL=http://127.0.0.1:3000 BETTER_AUTH_SECRET=build-only-placeholder-not-used-by-running-service npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --chown=node:node --from=build /source/team/.next/standalone ./
COPY --chown=node:node --from=build /source/team/.next/static ./.next/static
COPY --chown=node:node --from=build /source/team/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

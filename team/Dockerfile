FROM node:22-bookworm-slim AS dependencies
WORKDIR /source
COPY . .
WORKDIR /source/team
RUN npm install --no-audit --no-fund
RUN node scripts/sync-editor.mjs

FROM dependencies AS build
RUN npm run build

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

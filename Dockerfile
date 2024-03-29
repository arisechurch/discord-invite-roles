FROM node:18-alpine AS deps-build
RUN apk add --no-cache libc6-compat python3 build-base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false


FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 build-base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production


FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps-build /app/node_modules ./node_modules
RUN yarn build


FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN apk add -U --no-cache socat rlwrap

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S app -u 1001
# RUN chown -R app:nodejs /app/dist
# USER app

CMD ["node", "dist/main.js"]

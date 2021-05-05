FROM node:alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile


FROM node:alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build


FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY package.json yarn.lock ./
RUN yarn install --production

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001
RUN chown -R app:nodejs /app/dist
USER app

CMD ["node", "dist/main.js"]

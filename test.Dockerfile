FROM node:19-alpine as build
WORKDIR /app
COPY . .
RUN npm install -g npm@latest \
    && npm install \
    && npm run build

FROM node:19-alpine
WORKDIR /app
COPY --from=build /app .
RUN npm install -g npm@latest \
    && npm install --production
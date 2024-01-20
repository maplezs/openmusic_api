const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT
  },
  rabbitMq: {
    server: process.env.RABBITMQ_SERVER
  },
  redis: {
    host: process.env.REDIS_SERVER
  },
  authentication: {
    jwtSecretKey: process.env.ACCESS_TOKEN_KEY,
    jwtRefreshKey: process.env.REFRESH_TOKEN_KEY,
    jwtAge: process.env.ACCESS_TOKEN_AGE
  }
}

module.exports = config

require('dotenv').config()
const Hapi = require('@hapi/hapi')
const Jwt = require('@hapi/jwt')
const Inert = require('@hapi/inert')
const path = require('path')
const config = require('./utils/config.js')

// albums service plugin
const albums = require('./api/albums')
const AlbumsService = require('./services/postgres/AlbumsService')
const AlbumsValidator = require('./validator/albums')

// songs service plugin
const songs = require('./api/songs')
const SongsService = require('./services/postgres/SongsService')
const SongsValidator = require('./validator/songs')

// users service plugin
const users = require('./api/users')
const UsersService = require('./services/postgres/UsersService')
const UsersValidator = require('./validator/users')

// auth service plugin
const authentications = require('./api/authentications')
const AuthenticationsService = require('./services/postgres/AuthenticationsService')
const TokenManager = require('./tokenize/TokenManager')
const AuthenticationsValidator = require('./validator/authentications')

// playlists service plugin
const playlists = require('./api/playlists')
const PlaylistsService = require('./services/postgres/PlaylistsService')
const PlaylistsValidator = require('./validator/playlists')

// collaborations service plugin
const collaborations = require('./api/collaborations')
const CollaborationsService = require('./services/postgres/CollaborationsService')
const CollaborationsValidator = require('./validator/collaborations')

// Exports plugin
const _exports = require('./api/exports')
const ProducerService = require('./services/rabbitmq/ProducerService')
const ExportsValidator = require('./validator/exports')
const ClientError = require('./exceptions/ClientError')

// uploads service
const StorageService = require('./services/storage/StorageService')
const UploadsValidator = require('./validator/uploads')

// cache service
const CacheService = require('./services/redis/CacheService')

// init server
const init = async () => {
  const cacheService = new CacheService()
  const albumsService = new AlbumsService(cacheService)
  const songsService = new SongsService(cacheService)
  const usersService = new UsersService()
  const authenticationsService = new AuthenticationsService()
  const collaborationsService = new CollaborationsService(cacheService)
  const playlistsService = new PlaylistsService(collaborationsService, cacheService)
  const storageService = new StorageService(path.resolve(__dirname, 'api/albums/file/covers'))
  const server = Hapi.server({
    port: config.app.port,
    host: config.app.host,
    routes: {
      cors: {
        origin: ['*']
      }
    }
  })
  await server.register([
    {
      plugin: Jwt
    },
    {
      plugin: Inert
    }
  ])

  server.auth.strategy('openmusic_api_jwt', 'jwt', {
    keys: config.authentication.jwtSecretKey,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.authentication.jwtAge
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id
      }
    })
  })

  await server.register([{
    plugin: albums,
    options: {
      albumsService,
      storageService,
      albumsValidator: AlbumsValidator,
      uploadsValidator: UploadsValidator
    }
  }, {
    plugin: songs,
    options: {
      service: songsService,
      validator: SongsValidator
    }
  }, {
    plugin: users,
    options: {
      service: usersService,
      validator: UsersValidator
    }
  }, {
    plugin: authentications,
    options: {
      usersService,
      authenticationsService,
      tokenManager: TokenManager,
      validator: AuthenticationsValidator
    }
  }, {
    plugin: playlists,
    options: {
      playlistsService,
      songsService,
      validator: PlaylistsValidator
    }
  }, {
    plugin: collaborations,
    options: {
      collaborationsService,
      playlistsService,
      usersService,
      validator: CollaborationsValidator
    }
  }, {
    plugin: _exports,
    options: {
      producerService: ProducerService,
      playlistsService,
      validator: ExportsValidator
    }
  }
  ])
  server.ext('onPreResponse', (request, h) => {
    const { response } = request
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message
        })
        newResponse.code(response.statusCode)
        return newResponse
      }
      if (!response.isServer) {
        return h.continue
      }
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server'
      })
      newResponse.code(500)
      return newResponse
    }
    return h.continue
  })
  await server.start()
  console.log(`Server berjalan pada ${server.info.uri}`)
}
// mulai server
init()

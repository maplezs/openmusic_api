const routes = (handler) => [
  {
    method: 'POST',
    path: '/playlists',
    handler: handler.postPlaylistHandler,
    options: {
      auth: 'openmusic_api_jwt'
    }
  },
  {
    method: 'GET',
    path: '/playlists',
    handler: handler.getPlaylistsHandler,
    options: {
      auth: 'openmusic_api_jwt'
    }
  },
  {
    method: 'DELETE',
    path: '/playlists/{id}',
    handler: handler.deletePlaylistByIdHandler,
    options: {
      auth: 'openmusic_api_jwt'
    }
  },
  {
    method: 'POST',
    path: '/playlists/{id}/songs',
    handler: handler.postSongInPlaylistHandler,
    options: {
      auth: 'openmusic_api_jwt'
    }
  },
  {
    method: 'GET',
    path: '/playlists/{id}/songs',
    handler: handler.getSongInPlaylistHandler,
    options: {
      auth: 'openmusic_api_jwt'
    }
  },
  {
    method: 'DELETE',
    path: '/playlists/{id}/songs',
    handler: handler.deleteSongInPlaylistHandler,
    options: {
      auth: 'openmusic_api_jwt'
    }
  }
]

module.exports = routes
const autoBind = require('auto-bind')

class PlaylistsHandler {
  constructor (service, validator) {
    this._service = service
    this._validator = validator
    autoBind(this)
  }

  async postPlaylistHandler (request, h) {
    this._validator.validatePostPlaylistPayloadSchema(request.payload)
    const { name } = request.payload
    const { id: credentialId } = request.auth.credentials
    const playlistId = await this._service.addPlaylist({ name, owner: credentialId })
    const response = h.response({
      status: 'success',
      data: {
        playlistId
      }
    })
    response.code(201)
    return response
  }

  async getPlaylistsHandler (request, h) {
    const { id: credentialId } = request.auth.credentials
    const playlists = await this._service.getPlaylists(credentialId)
    return {
      status: 'success',
      data: {
        playlists
      }
    }
  }

  async deletePlaylistHandler (request, h) {
    const { id } = request.params
    await this._service.deletePlaylist(id)
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus'
    }
  }

  async postSongToPlaylistHandler (request, h) {
    this._validator.validatePostPlaylistSongPayloadSchema(request.payload)
    const { id } = request.params
    await this._service.addSongToPlaylist({id, songId: request.payload})
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist'
    })
    response.code(201)
    return response
  }

  async getSongInPlaylistHandler (request, h) {
    const { id } = request.params
    await this._service.getSongsInPlaylist(id)
    const response = h.response({
      status: 'success',
      data: {
        playlist
      }
    })
    return response
  }

  async deleteSongInPlaylistHandler (request, h) {
    this._validator.validatePostPlaylistSongPayloadSchema(request.payload)
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params
    await this._service.deleteSongInPlaylist(id, request.payload, credentialId)
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus'
    }
  }
}

module.exports = PlaylistsHandler

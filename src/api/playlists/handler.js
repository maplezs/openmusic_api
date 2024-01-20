const autoBind = require('auto-bind')

class PlaylistsHandler {
  constructor (playlistsService, songsService, validator) {
    this._playlistsService = playlistsService
    this._songsService = songsService
    this._validator = validator
    autoBind(this)
  }

  async postPlaylistHandler (request, h) {
    this._validator.validatePostPlaylistPayloadSchema(request.payload)
    const { name } = request.payload
    const { id: credentialId } = request.auth.credentials
    const playlistId = await this._playlistsService.addPlaylist({ name, owner: credentialId })
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
    const { playlists, header } = await this._playlistsService.getPlaylists(credentialId)
    const response = h.response({
      status: 'success',
      data: {
        playlists
      }
    })
    response.header('X-Data-Source', header)
    return response
  }

  async deletePlaylistHandler (request, h) {
    const { id } = request.params
    const { id: credentialId } = request.auth.credentials

    await this._playlistsService.verifyPlaylistOwner(id, credentialId)
    await this._playlistsService.deletePlaylist(id)

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus'
    }
  }

  async postSongToPlaylistHandler (request, h) {
    this._validator.validatePostPlaylistSongPayloadSchema(request.payload)
    const { id } = request.params
    const { songId } = request.payload
    const { id: credentialId } = request.auth.credentials

    await this._playlistsService.verifyPlaylistAccess(id, credentialId)
    await this._songsService.getSongById(songId)
    await this._playlistsService.addSongToPlaylist({ playlistId: id, songId })
    await this._playlistsService.addPlaylistActivity(id, credentialId, songId, 'add')

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist'
    })
    response.code(201)
    return response
  }

  async getSongInPlaylistHandler (request, h) {
    const { id } = request.params
    const { id: credentialId } = request.auth.credentials
    await this._playlistsService.verifyPlaylistAccess(id, credentialId)
    const { playlist, header } = await this._playlistsService.getSongsInPlaylist(id)
    const response = h.response({
      status: 'success',
      data: {
        playlist
      }
    })
    response.header('X-Data-Source', header)
    return response
  }

  async deleteSongInPlaylistHandler (request, h) {
    this._validator.validatePostPlaylistSongPayloadSchema(request.payload)
    const { id: credentialId } = request.auth.credentials
    const { id } = request.params
    const { songId } = request.payload
    await this._playlistsService.verifyPlaylistAccess(id, credentialId)
    await this._playlistsService.deleteSongInPlaylist(id, songId)
    await this._playlistsService.addPlaylistActivity(id, credentialId, songId, 'delete')
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus'
    }
  }

  async getPlaylistActivityHandler (request, h) {
    const { id: credentialId } = request.auth.credentials
    const { id } = request.params
    await this._playlistsService.verifyPlaylistAccess(id, credentialId)
    const { activities, header } = await this._playlistsService.getPlaylistActivity(id)
    const response = h.response({
      status: 'success',
      data: {
        playlistId: id,
        activities
      }
    })
    response.header('X-Data-Source', header)
    return response
  }
}

module.exports = PlaylistsHandler

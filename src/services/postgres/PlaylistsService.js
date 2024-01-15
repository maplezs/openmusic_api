const { Pool } = require('pg')
const { nanoid } = require('nanoid')
const InvariantError = require('../../exceptions/InvariantError')
const { mapDBToModel } = require('../../utils')
const NotFoundError = require('../../exceptions/NotFoundError')
const AuthorizationError = require('../../exceptions/AuthorizationError')

class PlaylistsService {
  constructor (collaborationsService) {
    this._pool = new Pool()
    this._collaborationsService = collaborationsService
  }

  async addPlaylist ({ name, owner }) {
    const id = `playlist-${nanoid(16)}`
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan')
    }
    return result.rows[0].id
  }

  async getPlaylists (owner) {
    const query = {
      text: 'SELECT playlists.id, playlists.name, users.username FROM playlists LEFT JOIN users ON playlists.owner = users.id LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id WHERE playlists.owner = $1  OR collaborations.user_id = $1',
      values: [owner]
    }
    const result = await this._pool.query(query)
    return result.rows
  }

  async deletePlaylist (id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id, owner',
      values: [id]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan')
    }
  }

  async addSongToPlaylist ({ playlistId, songId }) {
    const resultSongPlaylist = await this._pool.query('SELECT * FROM songs_playlists WHERE playlist_id = $1 AND song_id = $2', [playlistId, songId])
    if (resultSongPlaylist.rows.length) {
      throw new InvariantError('Lagu sudah ada pada playlist')
    }
    const id = `songs_playlists-${nanoid(16)}`
    const query = {
      text: 'INSERT INTO songs_playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Gagal menambahkan lagu. Playlist tidak ditemukan')
    }
  }

  async getSongsInPlaylist (id) {
    const queryPlaylist = {
      text: 'SELECT playlists.id, playlists.name, users.username FROM playlists INNER JOIN users ON users.id = playlists.owner WHERE playlists.id = $1',
      values: [id]
    }
    const resultPlaylist = await this._pool.query(queryPlaylist)
    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan')
    }
    const querySongs = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM songs INNER JOIN songs_playlists ON songs.id = songs_playlists.song_id WHERE songs_playlists.playlist_id = $1',
      values: [id]
    }
    const resultSongs = await this._pool.query(querySongs)
    return {
      ...resultPlaylist.rows.map(mapDBToModel)[0],
      songs: resultSongs.rows
    }
  }

  async deleteSongInPlaylist (id, songId) {
    const query = {
      text: 'DELETE FROM songs_playlists WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [id, songId]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Playlist tidak ditemukan')
    }
  }
  async addPlaylistActivityHandler (id) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id]
    }
  }
  async getPlaylistActivityHandler (id) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id]
    }
  }
  async verifyPlaylistOwner (id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan')
    }
    const playlist = result.rows[0]
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini')
    }
  }

  async verifyPlaylistAccess (playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId)
      } catch {
        throw error
      }
    }
  }
}
module.exports = PlaylistsService

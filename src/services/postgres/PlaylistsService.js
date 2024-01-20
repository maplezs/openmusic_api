const { Pool } = require('pg')
const { nanoid } = require('nanoid')
const InvariantError = require('../../exceptions/InvariantError')
const NotFoundError = require('../../exceptions/NotFoundError')
const AuthorizationError = require('../../exceptions/AuthorizationError')

class PlaylistsService {
  constructor (collaborationsService, cacheService) {
    this._pool = new Pool()
    this._collaborationsService = collaborationsService
    this._cacheService = cacheService
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
    await this._cacheService.delete(`playlists:${owner}`)
    return result.rows[0].id
  }

  async getPlaylists (owner) {
    try {
      const result = await this._cacheService.get(`playlists:${owner}`)
      return {
        playlists: JSON.parse(result),
        header: 'cache'
      }
    } catch (error) {
      const query = {
        text: `SELECT playlists.id, playlists.name, users.username FROM playlists 
        LEFT JOIN users ON playlists.owner = users.id
        LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id 
        WHERE playlists.owner = $1  OR collaborations.user_id = $1`,
        values: [owner]
      }
      const result = await this._pool.query(query)
      await this._cacheService.set(`playlists:${owner}`, JSON.stringify(result.rows))
      return {
        playlists: result.rows,
        header: 'db'
      }
    }
  }

  async deletePlaylist (id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id, owner',
      values: [id]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan')
    }
    const { owner } = result.rows[0]
    await this._cacheService.delete(`playlists:${owner}`)
  }

  async addSongToPlaylist ({ playlistId, songId }) {
    const query = {
      text: 'INSERT INTO songs_playlists (playlist_id, song_id) VALUES($1, $2) RETURNING id',
      values: [playlistId, songId]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new NotFoundError('Gagal menambahkan lagu. Playlist tidak ditemukan')
    }
    await this._cacheService.delete(`songsPlaylists:${playlistId}`)
  }

  async getSongsInPlaylist (id) {
    try {
      const result = await this._cacheService.get(`songsPlaylists:${id}`)
      return {
        playlist: JSON.parse(result),
        header: 'cache'
      }
    } catch (error) {
      const queryPlaylist = {
        text: `SELECT playlists.id, playlists.name, users.username FROM playlists
        INNER JOIN users ON users.id = playlists.owner 
        WHERE playlists.id = $1`,
        values: [id]
      }
      const resultPlaylist = await this._pool.query(queryPlaylist)
      if (!resultPlaylist.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan')
      }
      const querySongs = {
        text: `SELECT songs.id, songs.title, songs.performer FROM songs 
        INNER JOIN songs_playlists ON songs.id = songs_playlists.song_id 
        WHERE songs_playlists.playlist_id = $1`,
        values: [id]
      }
      const resultSongs = await this._pool.query(querySongs)
      await this._cacheService.set(`songsPlaylists:${id}`, JSON.stringify({
        ...resultPlaylist.rows[0],
        songs: resultSongs.rows
      }))
      return {
        playlist: {
          ...resultPlaylist.rows[0],
          songs: resultSongs.rows
        },
        header: 'db'
      }
    }
  }

  async deleteSongInPlaylist (id, songId) {
    const query = {
      text: 'DELETE FROM songs_playlists WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [id, songId]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Playlist tidak ditemukan')
    }
    await this._cacheService.delete(`songsPlaylists:${id}`)
  }

  async addPlaylistActivity (id, userId, songId, action) {
    const query = {
      text: 'INSERT INTO playlists_activities (playlist_id, user_id, song_id, action) VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, userId, songId, action]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new InvariantError('Aktivitas playlist gagal ditambahkan')
    }
    await this._cacheService.delete(`playlistActivity:${id}`)
  }

  async getPlaylistActivity (id) {
    try {
      const result = await this._cacheService.get(`playlistActivity:${id}`)
      return {
        activities: JSON.parse(result),
        header: 'cache'
      }
    } catch (error) {
      const query = {
        text: `SELECT users.username, songs.title, playlists_activities.action, playlists_activities.time FROM playlists_activities 
        LEFT JOIN users ON users.id = playlists_activities.user_id 
        LEFT JOIN songs ON songs.id = playlists_activities.song_id 
        WHERE playlists_activities.playlist_id = $1`,
        values: [id]
      }
      const result = await this._pool.query(query)
      await this._cacheService.set(`playlistActivity:${id}`, JSON.stringify(result.rows))
      return {
        activities: result.rows,
        header: 'db'
      }
    }
  }

  async verifyPlaylistOwner (id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
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

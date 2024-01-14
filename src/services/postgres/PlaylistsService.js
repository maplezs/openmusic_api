const { Pool } = require('pg')
const { nanoid } = require('nanoid')
const InvariantError = require('../../exceptions/InvariantError')
const { mapDBToModel } = require('../../utils')
const NotFoundError = require('../../exceptions/NotFoundError')

class SongsService {
  constructor () {
    this._pool = new Pool()
  }

  async addPlaylist ({name, owner}) {
    const id = `playlist-${nanoid(16)}`
    const query = {
      text: 'INSERT INTO playlist VALUES($1, $2, $3) RETURNING id',
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
      text: 'SELECT * FROM playlists WHERE owner = $1',
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

  async addSongToPlaylist ({id, songId}) {
    const query = {
      text: 'INSERT INTO songs_playlists VALUES($1, $2) RETURNING id',
      values: [id, songId]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Gagal menambahkan lagu. Playlist atau lagu tidak ditemukan')
    }
  }

  async getSongsInPlaylist (id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Musik gagal dihapus. Id tidak ditemukan')
    }
  }
}
module.exports = SongsService

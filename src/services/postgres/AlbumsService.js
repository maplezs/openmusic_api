const { Pool } = require('pg')
const { nanoid } = require('nanoid')
const InvariantError = require('../../exceptions/InvariantError')
const { mapDBToModel } = require('../../utils')
const NotFoundError = require('../../exceptions/NotFoundError')

class AlbumsService {
  constructor () {
    this._pool = new Pool()
  }

  async addAlbum ({ name, year }) {
    const id = `album-${nanoid(16)}`
    const createdAt = new Date().toISOString()
    const updatedAt = createdAt
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new InvariantError('Album gagal ditambahkan')
    }
    return result.rows[0].id
  }

  async getAlbumById (id) {
    const resultAlbum = await this._pool.query('SELECT id, name, year FROM albums WHERE id = $1', [id])
    if (!resultAlbum.rows.length) {
      throw new NotFoundError('Album tidak ditemukan')
    }
    const resultSongs = await this._pool.query('SELECT id, title, performer FROM songs WHERE album_id = $1', [id])
    return {
      ...resultAlbum.rows.map(mapDBToModel)[0],
      songs: resultSongs.rows
    }
  }

  async editAlbumById (id, { name, year }) {
    const updatedAt = new Date().toISOString()
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan')
    }
  }

  async deleteAlbumById (id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id]
    }
    const result = await this._pool.query(query)
    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan')
    }
  }
}
module.exports = AlbumsService

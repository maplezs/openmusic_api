const { Pool } = require('pg')
const { nanoid } = require('nanoid')
const { mapDBAlbumToModel } = require('../../utils')
const InvariantError = require('../../exceptions/InvariantError')
const NotFoundError = require('../../exceptions/NotFoundError')

class AlbumsService {
  constructor (cacheService) {
    this._pool = new Pool()
    this._cacheService = cacheService
  }

  async addAlbum ({ name, year }) {
    const id = `album-${nanoid(16)}`
    const createdAt = new Date().toISOString()
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, createdAt]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new InvariantError('Album gagal ditambahkan')
    }
    return result.rows[0].id
  }

  async getAlbumById (id) {
    const resultAlbum = await this._pool.query('SELECT id, name, year, cover FROM albums WHERE id = $1', [id])
    if (!resultAlbum.rowCount) {
      throw new NotFoundError('Album tidak ditemukan')
    }
    const resultSongs = await this._pool.query('SELECT id, title, performer FROM songs WHERE album_id = $1', [id])
    return {
      ...resultAlbum.rows.map(mapDBAlbumToModel)[0],
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
    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan')
    }
  }

  async deleteAlbumById (id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan')
    }
  }

  async editAlbumCoverById (id, fileLocation) {
    const updatedAt = new Date().toISOString()
    const query = {
      text: 'UPDATE albums SET updated_at = $1, cover = $2 WHERE id = $3 RETURNING id',
      values: [updatedAt, fileLocation, id]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui sampul Album. Id tidak ditemukan')
    }
  }

  async addAlbumLike (id, userId) {
    const query = {
      text: 'INSERT INTO user_album_likes (album_id, user_id) VALUES($1, $2) RETURNING id',
      values: [id, userId]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new InvariantError('Gagal menambahkan like album')
    }
    await this._cacheService.delete(`albumLikes:${id}`)
    return result.rows[0].id
  }

  async verifyAlbumLike (id, userId) {
    const queryCheck = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [id, userId]
    }
    const result = await this._pool.query(queryCheck)
    if (result.rowCount > 0) {
      throw new InvariantError('Album sudah disukai')
    }
  }

  async getAlbumLikes (id) {
    try {
      const result = await this._cacheService.get(`albumLikes:${id}`)
      return {
        likes: result,
        header: 'cache'
      }
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id]
      }
      const result = await this._pool.query(query)
      if (!result.rowCount) {
        throw new NotFoundError('Album tidak ditemukan')
      }
      await this._cacheService.set(`albumLikes:${id}`, result.rowCount)
      return {
        likes: result.rowCount,
        header: 'db'
      }
    }
  }

  async deleteAlbumLike (id, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [id, userId]
    }
    const result = await this._pool.query(query)
    if (!result.rowCount) {
      throw new NotFoundError('Like pada album gagal dihapus. Id tidak ditemukan')
    }
    await this._cacheService.delete(`albumLikes:${id}`)
  }
}
module.exports = AlbumsService

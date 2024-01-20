const autoBind = require('auto-bind')

class AlbumsHandler {
  constructor (albumsService, storageService, albumsValidator, uploadsValidator) {
    this._albumsService = albumsService
    this._storageService = storageService
    this._albumsValidator = albumsValidator
    this._uploadsValidator = uploadsValidator
    autoBind(this)
  }

  async postAlbumHandler (request, h) {
    this._albumsValidator.validateAlbumPayload(request.payload)
    const albumId = await this._albumsService.addAlbum(request.payload)
    const response = h.response({
      status: 'success',
      data: {
        albumId
      }
    })
    response.code(201)
    return response
  }

  async getAlbumByIdHandler (request, h) {
    const { id } = request.params
    const album = await this._albumsService.getAlbumById(id)
    return {
      status: 'success',
      data: {
        album
      }
    }
  }

  async putAlbumByIdHandler (request, h) {
    this._albumsValidator.validateAlbumPayload(request.payload)
    const { id } = request.params
    await this._albumsService.editAlbumById(id, request.payload)
    return {
      status: 'success',
      message: 'Album berhasil diperbarui'
    }
  }

  async deleteAlbumByIdHandler (request, h) {
    const { id } = request.params
    await this._albumsService.deleteAlbumById(id)
    return {
      status: 'success',
      message: 'Album berhasil dihapus'
    }
  }

  async postAlbumCoversHandler (request, h) {
    const { cover } = request.payload
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers)
    const { id } = request.params
    const filename = await this._storageService.writeFile(cover, cover.hapi)
    const fileURL = `http://${process.env.HOST}:${process.env.PORT}/albums/covers/${filename}`
    await this._albumsService.editAlbumCoverById(id, fileURL)
    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah'
    })
    response.code(201)
    return response
  }

  async postAlbumLikesHandler (request, h) {
    const { id: credentialId } = request.auth.credentials
    const { id } = request.params
    await this._albumsService.getAlbumById(id)
    await this._albumsService.verifyAlbumLike(id, credentialId)
    await this._albumsService.addAlbumLike(id, credentialId)
    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan like pada album'
    })
    response.code(201)
    return response
  }

  async getAlbumLikesHandler (request, h) {
    const { id } = request.params
    const { likes, header } = await this._albumsService.getAlbumLikes(id)
    const response = h.response({
      status: 'success',
      data: {
        likes: +likes
      }
    })
    response.header('X-Data-Source', header)
    return response
  }

  async deleteAlbumLikesHandler (request, h) {
    const { id: credentialId } = request.auth.credentials
    const { id } = request.params
    await this._albumsService.deleteAlbumLike(id, credentialId)
    return {
      status: 'success',
      message: 'Berhasil menghapus like pada album'
    }
  }
}

module.exports = AlbumsHandler

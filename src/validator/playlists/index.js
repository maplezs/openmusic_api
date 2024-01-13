const InvariantError = require('../../exceptions/InvariantError')
const {
  PostPlaylistPayloadSchema, 
  PostPlaylistSongPayloadSchema
} = require('./schema')

const PlaylistsValidator = {
  validatePostPlaylistPayloadSchema: (payload) => {
    const validationResult = PostPlaylistPayloadSchema.validate(payload)
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message)
    }
  },
  validatePostPlaylistSongPayloadSchema: (payload) => {
    const validationResult = PostPlaylistSongPayloadSchema.validate(payload)
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message)
    }
  }
}

module.exports = PlaylistsValidator

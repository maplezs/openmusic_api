const mapDBToModel = ({
  id,
  ...args
}) => ({
  id,
  ...args
})

const mapDBAlbumToModel = ({
  id,
  name,
  year,
  cover
}) => ({
  id,
  name,
  year,
  coverUrl: cover
})

module.exports = { mapDBToModel, mapDBAlbumToModel }

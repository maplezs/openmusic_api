const mapDBToModel = ({
  id,
  ...args
}) => ({
  id,
  ...args
})

const mapSongDBToModel = ({
  id,
  name,
  username,
  song_id,
  title,
  performer
}) => ({
  id,
  name,
  username,
  songs : [{
    song_id, title, performer
  }
  ]
})
module.exports = { mapDBToModel, mapSongDBToModel }

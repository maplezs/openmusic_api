const routes = (handler) => [
  {
    method: 'POST',
    path: '/authentications',
    handler: handler.postAuthenticationHandler
  },
  {
    method: 'PUT',
    path: '/authentications',
    handler: handler.putAuthenticationByIdHandler
  },
  {
    method: 'DELETE',
    path: '/authentications',
    handler: handler.deleteAuthenticationByIdHandler
  }
]

module.exports = routes

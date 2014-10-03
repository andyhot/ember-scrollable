`import Ember from 'ember'`

ApplicationRoute = Ember.Route.extend
  model: ->
    Ember.RSVP.hash
      currentUser: @store.find('user', 'me')

  actions:
    error: (error) ->
      if error.status == 401
        window.location.replace(config.APP.authURL)
      else
        true

`export default ApplicationRoute`

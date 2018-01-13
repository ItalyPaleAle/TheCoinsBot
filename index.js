'use strict'

const App = require('./lib/App')

App.Start()
    .then(() => {
        if(App.pino) {
            App.pino.info('App started')
        }
        else {
            console.log('App started')
        }
    })
    .catch((err) => {
        if(App.pino) {
            App.pino.error({error: 'Uncaught exception\n', exception: err})
        }
        else {
            console.error('Uncaught exception\n', err)
        }
    })


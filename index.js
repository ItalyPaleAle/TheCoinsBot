'use strict'

const app = require('./lib/App')

app()
    .then(() => {
        console.log('App started')
    })
    .catch((err) => {
        console.error('Uncaught exception\n', err)
    })

'use strict'

const Composer = require('telegraf/composer')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

// Responds to /settings
// Also used by /start
module.exports = (state) => {
    const {bot, telemetry, config} = state

    const settingsFunc = (ctx, next) => {
        telemetry.info({action: 'replied', reply: 'settings', from: ctx.from.id})

        ctx.scene.enter('settings-wizard')

        return next()
    }
    bot.command('settings', settingsFunc)
    bot.start(settingsFunc)
}

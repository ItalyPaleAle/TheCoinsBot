'use strict'

const User = require('../schema/User')

// Add "user" to the bot's context
module.exports = (state) => {
    const {bot, config} = state

    // Sets the default value for the region in the User model
    User.setDefaultRegion(config.get('defaultRegion'))

    /**
     * Returns the Mongoose User object for the current user
     *
     * @param {TelegrafContext} ctx Context from Telegraf
     * @return {Promise<User>} Promise that resolves with a Mongoose User object
     * @async
     */
    bot.context.user = async (ctx) => {
        return User.findByUserIdOrCreate(ctx.from.id)
    }
}

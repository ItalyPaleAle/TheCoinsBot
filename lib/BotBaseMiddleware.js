'use strict'

// Base middleware for the bots

module.exports = (state, logExtra) => {
    const {telemetry, pino} = state

    return async (ctx, next) => {
        try {
            // What to log
            let logData = {}
            if(ctx.from) {
                logData.from = ctx.from.id || null,
                logData.isBot = ctx.from.is_bot
            }
            if(ctx.updateType == 'message') {
                logData.update = {
                    type: 'message',
                    text: ctx.update.message.text
                }
            }
            else if(ctx.updateType == 'callback_query') {
                logData.update = {
                    type: 'callback_query',
                    text: ctx.update.callback_query.message.text,
                    data: ctx.update.callback_query.data
                }
            }
            if(logExtra) {
                Object.assign(logData, logExtra || {})
            }

            // Is this a message we want to reply to?
            if(!ctx ||
                !ctx.from ||
                !ctx.from.id ||
                ctx.from.is_bot // Ignore messages coming from bots
            ) {
                // Do nothing here, beside logging
                telemetry.info(Object.assign({}, logData, {action: 'ignored'}))
            }
            else {
                // Continue responding
                telemetry.info(Object.assign({}, logData, {action: 'mesage'}))
                await next()
            }
        } catch(err) {
            // Catch and log all exceptions happening while responding to messages
            // This is very important because otherwise the app goes into a state where it hangs with unprocessed messages
            // Also, it allows us to log the exception and notify the user
            pino.fatal({
                type: 'exception',
                message: err.message,
                stack: err.stack
            })

            ctx.replyWithMarkdown('😢 An internal error occurred and we cannot reply to you… Please try again!\n_PS: one of our admins has been notified_')
        }
    }
}

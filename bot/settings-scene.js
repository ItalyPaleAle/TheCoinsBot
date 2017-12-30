'use strict'

const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

module.exports = (state) => {
    const {stage, telemetry, config} = state

    // List of regions
    const regions = config.get('regions')

    // Step 1: choose a region
    const step1 = async (ctx) => {
        telemetry.info({scene: 'settings-wizard', action: 'replied', from: ctx.from.id, step: 'start'})

        await ctx.reply('To start, what is your region?')

        // List of regions
        const keys = Object.keys(regions).map((id) => {
            return [Markup.callbackButton(regions[id].label, id)]
        })
        const result = await ctx.reply('Choose:', Markup.inlineKeyboard(keys).extra())
        // Save chat.id and message_id in the session to delete it later
        ctx.scene.state = {step1message: {chatId: result.chat.id, messageId: result.message_id}}

        return ctx.wizard.next()
    }

    // Step 1 answer: region
    const regionHandler = new Composer()
    Object.keys(regions).forEach((id) => {
        regionHandler.action(id, async (ctx) => {
            telemetry.info({scene: 'settings-wizard', action: 'replied', from: ctx.from.id, step: 'region', pick: id})

            // Store region in the user's profile
            const user = await ctx.user(ctx)
            user.region = id
            await user.save()

            // Delete the old message (asynchronously, do not wait)
            const delMessage = ctx.scene.state.step1message
            if(delMessage) {
                ctx.deleteMessage(delMessage.chatId, delMessage.messageId)
                delete ctx.scene.state.step1message
            }

            // Respond to the user
            await ctx.reply("Looks like you're in " + regions[id].label + ", that's so cool!")

            await ctx.replyWithMarkdown("*That's all, you're ready to go!* If you want to change your preferences later, just type `/settings`. PS: Type `/help` if you need assistance to use the bot!")

            return ctx.scene.leave() // Promise
        })
    })
    regionHandler.use((ctx) => {
        telemetry.info({scene: 'settings-wizard', action: 'replied', from: ctx.from.id, step: 'region', invalid: ctx.message})
        ctx.replyWithMarkdown("Hey, don't forget to choose a region!")
    })

    // Build the wizard
    const settingsWizard = new WizardScene('settings-wizard',
        step1,
        regionHandler
    )

    // Middleware when leaving the scene
    settingsWizard.leave((ctx, next) => {
        telemetry.info({scene: 'settings-wizard', action: 'end', from: ctx.from.id})

        return next()
    })

    // Register the scene
    stage.register(settingsWizard)
}

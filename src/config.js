const { readYamlEnvSync } = require('yaml-env-defaults');

function getConfig() {
    return readYamlEnvSync('bots.yml');
}

function getRegion(botId) {
    const config = getConfig();
    return (botId && config.bots[botId].region) || config.region
}

function defaultGcloudOptions(options) {
    const { botId, regionField } = options || {}
    const config = getConfig();
    const region = getRegion(botId)

    return [
        `--${regionField || 'region'}=${region}`,
        `--project=${config.projectId}`,
        `--quiet`,
    ]
}

function getImageTag(botId) {
    const config = getConfig()
    const bot = config.bots[botId]
    const image = bot.image
    return `gcr.io/${config.projectId}/${image}`
}

module.exports = {
    getConfig,
    defaultGcloudOptions,
    getImageTag,
    getRegion,
}

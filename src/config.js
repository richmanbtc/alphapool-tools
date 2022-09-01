const { readYamlEnvSync } = require('yaml-env-defaults');

function getConfig() {
    return readYamlEnvSync('bots.yml');
}

function defaultGcloudOptions(regionField) {
    const config = getConfig();

    return [
        `--${regionField || 'region'}=${config.region}`,
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
}

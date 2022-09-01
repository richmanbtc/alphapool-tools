const fs = require('fs')
const yaml = require('js-yaml');
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const {getConfig, defaultGcloudOptions, getImageTag} = require('./config')
const _ = require("lodash");

async function buildImage(botId) {
    const config = getConfig()
    const bot = config.bots[botId]
    const image = bot.image
    const repo = image.replace(/:.*/, '')
    const tag = image.replace(/.*:/, '')

    const imageTag = getImageTag(botId)
    const repoUrl = `https://github.com/${repo}.git`
    const repoDir = 'repo'

    const build = {
        steps: [
            {
                name: 'gcr.io/cloud-builders/git',
                args: [ 'clone', '--recursive', repoUrl, repoDir ],
            },
            {
                name: 'gcr.io/cloud-builders/git',
                args: [ 'checkout', tag ],
                dir: repoDir
            },
            {
                name: 'gcr.io/cloud-builders/docker',
                args: [ 'build', '-t', imageTag, '.' ],
                dir: repoDir
            },
        ],
        images: [
            imageTag,
        ]
    }

    const dir = fs.mkdtempSync('/tmp/alphapool')
    const configPath = dir + '/cloudbuild.yaml'
    fs.writeFileSync(configPath, yaml.dump(build), 'utf8');
    const options = _.flatten([
        `--no-source`,
        `--config="${configPath}"`,
        `--timeout=30m`,
        defaultGcloudOptions(),
    ])

    const command = `gcloud builds submit ${options.join(' ')}`
    console.log(command)
    console.log(build)
    const res = await exec(command)

    console.log(res.stdout)
    console.log(res.stderr)
}

module.exports = {
    buildImage
}

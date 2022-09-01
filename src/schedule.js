const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const {getConfig, defaultGcloudOptions, getImageTag} = require("./config");
const _ = require('lodash')
const sleep = require('sleep-promise');

async function schedule(botId) {
    const config = getConfig();
    const bot = config.bots[botId];
    if (bot.environment && bot.environment.ALPHAPOOL_MODEL_ID) {
        if (botId !== bot.environment.ALPHAPOOL_MODEL_ID) {
            throw new Error('botId !== bot.environment.ALPHAPOOL_MODEL_ID')
        }
    }

    if (await _runJobsExists(botId)) {
        await _deleteRunJobs(botId)
        console.log('waiting for deletion...')
        await sleep(5000)
    }
    await _ensureCreateRunJobs(botId)
    await _ensureCreateScheduler(botId)
}

async function _ensureCreateScheduler(botId) {
    const config = getConfig();
    const bot = config.bots[botId];
    const isUpdate = await _schedulerExists(botId)
    const options = _.flatten([
        isUpdate ? 'update' : 'create',
        'http',
        botId,
        `--schedule="${bot.cron}"`,
        `--uri="https://${config.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${config.projectId}/jobs/${botId}:run"`,
        `--http-method=POST`,
        `--oauth-service-account-email=${config.serviceAccount}`,
        defaultGcloudOptions('location'),
    ])

    const command = `gcloud scheduler jobs ${options.join(' ')}`
    console.log(command)
    const res = await exec(command)

    console.log(res.stdout)
    console.log(res.stderr)
}

async function _schedulerExists(botId) {
    const command = `gcloud scheduler jobs describe ${botId} ${defaultGcloudOptions('location').join(' ')}`
    try {
        console.log(command)
        await exec(command)
        return true
    } catch {}

    return false
}

async function _deleteRunJobs(botId) {
    const options = _.flatten([
        'delete',
        botId,
        defaultGcloudOptions(),
    ])

    const command = `gcloud beta run jobs ${options.join(' ')}`
    console.log(command)
    const res = await exec(command)

    console.log(res.stdout)
    console.log(res.stderr)
}

// update is not working
async function _ensureCreateRunJobs(botId) {
    const config = getConfig();
    const bot = config.bots[botId];
    const isUpdate = await _runJobsExists(botId)
    const imageTag = getImageTag(botId)
    const env = { ...config.environment, ...(bot.environment || {}) }
    const options = _.flatten([
        isUpdate ? 'update' : 'create',
        botId,
        `--max-retries=0`,
        `--task-timeout=180s`,
        `--memory=2048Mi`,
        `--image="${imageTag}"`,
        `--command="${bot.command || ''}"`,
        `--args="${(bot.args || []).join(',')}"`,
        `--set-cloudsql-instances="${config.cloudsqlInstances}"`,
        `--set-env-vars="${_.map(env, (v, k) => `${k}=${v}`).join(',')}"`,
        defaultGcloudOptions(),
    ])

    const command = `gcloud beta run jobs ${options.join(' ')}`
    console.log(command)
    const res = await exec(command)

    console.log(res.stdout)
    console.log(res.stderr)
}

async function _runJobsExists(botId) {
    const command = `gcloud beta run jobs describe ${botId} ${defaultGcloudOptions().join(' ')}`
    try {
        console.log(command)
        await exec(command)
        return true
    } catch {}

    return false
}

module.exports = {
    schedule
}

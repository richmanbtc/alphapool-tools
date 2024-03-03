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

    const deployKey = _.get(config, ['deployKeys', repo])
    const known_hosts = "github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk="
    const sshVolume = {
        name: 'ssh',
        path: '/root/.ssh',
    }

    const repoUrl = deployKey ? `git@github.com:${repo}.git` : `https://github.com/${repo}.git`
    const repoDir = 'repo'

    let steps = []

    if (deployKey) {
        steps = steps.concat([
            {
                name: 'gcr.io/cloud-builders/git',
                entrypoint: 'bash',
                args: [
                    '-c',
                    [
                        'echo "$$DEPLOY_KEY" > /root/.ssh/id_rsa',
                        'chmod 400 /root/.ssh/id_rsa',
                        `echo "${known_hosts}" > /root/.ssh/known_hosts`,
                    ].join(' && ')
                ],
                volumes: [sshVolume],
                env: [
                    'DEPLOY_KEY=$_DEPLOY_KEY'
                ]
            },
        ])
    }

    steps = steps.concat([
        {
            name: 'gcr.io/cloud-builders/git',
            args: [ 'clone', repoUrl, repoDir ],
            volumes: deployKey ? [sshVolume] : [],
        },
        {
            name: 'gcr.io/cloud-builders/git',
            args: [ 'checkout', tag ],
            dir: repoDir
        },
        {
            name: 'gcr.io/cloud-builders/git',
            args: [ 'submodule', 'update', '--init', '--recursive', ],
            dir: repoDir,
            volumes: deployKey ? [sshVolume] : [],
        },
        {
            name: 'gcr.io/cloud-builders/docker',
            args: [ 'build', '-t', imageTag, '.' ],
            dir: repoDir
        },
    ])

    const build = {
        steps: steps,
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
        deployKey ? `'--substitutions=_DEPLOY_KEY=${deployKey}'` : [],
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

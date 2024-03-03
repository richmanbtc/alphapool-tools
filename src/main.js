const { Command } = require('commander');
const program = new Command();
const {schedule, deleteJobs} = require('./schedule')
const {buildImage} = require("./build");
const open = require('open');
const {getConfig} = require("./config");
const _ = require('lodash');

console.error("Current directory:", process.cwd());

require('dotenv').config();

program
    .name('alphapool-tools')
    .description('CLI to manage alphapool')
    .version('0.8.0');

program.command('deploy-grafana')
    .description('Deploy grafana on cloud run')
    .action(async () => {
        await deployGrafana()
    });

program.command('deploy')
    .description('Build and schedule')
    .argument('<string>', 'bot name defined in config')
    .action(async (str) => {
        await buildImage(str)
        await schedule(str)
    });

program.command('build')
    .description('Build bot')
    .argument('<string>', 'bot name defined in config')
    .action((str) => {
        buildImage(str)
    });

program.command('schedule')
    .description('Create cloud run jobs and schedule it')
    .argument('<string>', 'bot name defined in config')
    .action((str) => {
        schedule(str)
    });

program.command('schedule-all')
    .description('Create cloud run jobs and schedule it for all bots')
    .action(async() => {
        const config = getConfig()
        await Promise.all(_.map(config.bots, (bot, botId) => {
            return schedule(botId)
        }))
    });

program.command('delete')
    .description('Delete cloud run jobs and schedule')
    .argument('<string>', 'bot name defined in config')
    .action((str) => {
        deleteJobs(str)
    });

program.command('browse')
    .description('Open related urls in browser')
    .option('--bot <string>', 'bot name defined in config')
    .action((options) => {
        const {region, projectId} = getConfig()
        const botId = options.bot
        if (botId) {
            open(`https://console.cloud.google.com/run/jobs/details/${region}/${botId}/executions?project=${projectId}`);
            open(`https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_scheduler_job%22%20AND%20resource.labels.job_id%3D%22${botId}%22%20AND%20resource.labels.location%3D%22${region}%22?project=${projectId}`)
        } else {
            open(`https://console.cloud.google.com/run/jobs?project=${projectId}`)
            open(`https://console.cloud.google.com/cloud-build/builds;region=${region}?project=${projectId}`)
            open(`https://console.cloud.google.com/cloudscheduler?project=${projectId}`)
        }
    });

program.parse();

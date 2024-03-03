const _ = require("lodash");
const {getConfig} = require("./config");

function pfInfo() {
    const bots = getConfig().bots

    const pfModels = []
    for (let key in bots) {
        if (!key.startsWith('pf-')) continue

        pfModels.push({
            modelId: key,
            pattern: _.get(
                bots[key],
                ['environment', 'ALPHAPOOL_MODEL_ID_REGEX'],
                '.*'
            )
        })
    }

    const table = []
    for (let key in bots) {
        if (!key.startsWith('m-')) continue

        const item = { modelId: key }
        _.each(pfModels, (pfModel) => {
            item[pfModel.modelId] = !!key.match(pfModel.pattern)
        })
        table.push(item)
    }

    console.log('ALPHAPOOL_MODEL_ID_REGEX test')
    console.table(table);
}

module.exports = {
    pfInfo,
}

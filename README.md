
## install

```bash
npm link
```

## config

create bots.yml in arbitrary dir

## use

in bots.yml directory

```bash
alphapool-tools
```

## memo

docker image build

- Only gcp repositories can be specified for cloud run images.
- Minor images, such as those built by myself, cannot be retrieved by mirror.gcr.io
- So I decided to build with cloud build

hanging

- execute the hanging command by hand

scheduler failed by unauthorized error

- see --oauth-service-account-email in https://cloud.google.com/run/docs/execute/jobs-on-schedule
- set GC_SERVICE_ACCOUNT env var

bot name (botId)

- The name must use only lowercase alphanumeric characters and dashes, cannot begin or end with a dash, and cannot be longer than 63 characters.
- This is gcloud constraint

Application exec likely failed
application failed to start: not available

- I don't know what caused it, but I think it stopped happening when I added more memory.

ip address

- cloud run jobs instance ip address seems to be always located in us
- ip address can be changed by https://cloud.google.com/run/docs/configuring/connecting-vpc

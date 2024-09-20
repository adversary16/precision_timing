Hi-res loop class for async tasks. Quick and dirty, but is consistent on discretions up to 500usec.
Use rps to set request per second ratio.

## Configuring

Set `APP_BATCH_SIZE` environment variable to adjust task batch size. Default value is 32.
Set `NODE_ENV` environment variable to `debug` or `develop` to see verbose logs

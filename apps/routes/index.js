const router = require('express').Router()
const util = require('util')
const path = require('path')
const exec = util.promisify(require('child_process').exec)
const readFile = util.promisify(require('fs').readFile)
const pickBy = require('lodash/pickBy')
const forOwn = require('lodash/forOwn')

const { catchAll } = require('../../utils/routes')
const db = require('../../db')
const logger = require('../../logger')

const REPO_REGEX = /.*github\.com\/(.*?)(\.git)?/
const FILE_REGEX = /file:.*/

const readDependencies = async () =>
  JSON.parse(await readFile(path.join(__dirname, '..', '..', 'package.json')))
    .dependencies

const resolved = url =>
  FILE_REGEX.test(url) && path.resolve(__dirname, '..', '..', url.substring(5))

const urlToPackageName = async url => {
  const dependencies = await readDependencies()

  return Object.keys(dependencies).find(packageName => {
    const packageUrl = dependencies[packageName]

    if (FILE_REGEX.test(url)) {
      return resolved(url) === resolved(packageUrl)
    }

    const repoName = url.match(REPO_REGEX)[1]

    let match = packageUrl.match(REPO_REGEX)
    match = match && match[1]
    return match === repoName
  })
}

const getApps = async () =>
  pickBy(
    await readDependencies(),
    (value, key) => FILE_REGEX.test(value) || REPO_REGEX.test(value)
  )

const installPackage = async url => {
  const command = `cd ${__dirname}; npm install ${url}`
  logger.debug(`Executing '${command}'.`)
  await exec(command).catch(err => {
    throw { message: 'Invalid repository URL.' }
  })
  logger.debug(`Executed '${command}'.`)
}

const mountApp = async (name, url) => {
  const mountPath = path.join('/', name)

  logger.debug(`Mounting '${name}':'${url}'.`)

  while (true) {
    try {
      let app = require(name)
      if (typeof app === 'function') {
        app = app()
      }

      const appRouter = app.install({ db, logger })

      appRouter.coreAppName = name

      router.use(mountPath, appRouter)
      break
    } catch (err) {
      await installPackage(url)
    }
  }

  logger.info(`Mounted '${name}' at '${mountPath}'.`)
}

router.get(
  '/',
  catchAll(async (req, res, next) => {
    const apps = await getApps()

    res.json(Object.keys(apps).map(name => ({ name })))
  })
)

router.post(
  '/',
  catchAll(async (req, res, next) => {
    const { body: { url, replace } } = req

    let name = await urlToPackageName(url)
    if (name) {
      logger.debug(`Package ${name} already exists.`)

      if (!replace) {
        return res.message('The app is already running.')
      }

      delete require.cache[require.resolve(name)]
    }

    await installPackage(url)

    if (!name) {
      name = await urlToPackageName(url)
    }

    await mountApp(name, url)

    res.json({ name })
  })
)

router.delete(
  '/:app',
  catchAll(async (req, res, next) => {
    const { params: { app: appName } } = req

    try {
      let app = require(appName)
      if (typeof app === 'function') {
        app = app()
      }

      app.uninstall()

      router.stack = router.stack.filter(
        layer => layer.handle.coreAppName !== appName
      )
    } catch (err) {
      throw { message: 'Invalid app name.' }
    }

    const command = `cd ${__dirname}; npm uninstall ${appName}`
    logger.debug(`Executing '${command}'.`)
    await exec(command).catch(err => {
      throw { message: 'Unexpected error while uninstalling app.' }
    })
    logger.debug(`Executed '${command}'.`)

    logger.info(`Uninstalled '${appName}.`)

    res.json(null)
  })
)

const setupModules = async () =>
  forOwn(await getApps(), (url, name) => mountApp(name, url))

setupModules()

module.exports = router

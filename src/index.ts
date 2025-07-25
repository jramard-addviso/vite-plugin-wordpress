import type { Plugin, ViteDevServer } from 'vite'
import { relative, resolve, sep } from 'node:path'
import { writeFile, readFile, unlink, access, mkdir } from 'node:fs/promises'
import { liveReload } from 'vite-plugin-live-reload'
import { phpConfigTemplate } from './utils.js'

export interface Config {
  /**
   * Wether file changes should be watched and cause a reload.
   * Either enable/disable it or provide your own paths to watch.
   * @see https://github.com/arnoson/vite-plugin-live-reload
   * @default true
   */
  watch?: boolean | string[]

  /**
   * The directory where the `.dev` file is placed.
   * @default process.cwd()
   */
  devDir?: string

  /**
   * Wordpress's config root.
   * @default 'config'
   */
  wordpressConfigDir?: string
}

let exitHandlersRegistered = false

export default (
  {
    watch = true,
    devDir = process.cwd(),
    wordpressConfigDir = 'config',
  } = {} as Config,
): Plugin => {
  const devPath = resolve(devDir, '.dev')
  const removeDevFile = () => unlink(devPath).catch((_e: Error) => {})

  return {
    name: 'vite-plugin-wordpress',

    config({ build }) {
      // Make sure a manifest is generated.
      return { build: { manifest: build?.manifest || true } }
    },

    async configResolved({ build, root }) {
      // Share some essential Vite config with Wordpress.
      let { outDir, assetsDir } = build

      // PHP needs the `outDir` relative to the project's root (cwd).
      outDir = relative(process.cwd(), resolve(root, outDir))
      outDir = outDir.replace(/\//g, sep)

      const file = `${wordpressConfigDir}/vite.config.php`
      const manifest =
        typeof build.manifest === 'string' ? build.manifest : undefined
      const rootDir = relative(process.cwd(), root) || undefined
      const config = phpConfigTemplate({
        rootDir,
        outDir,
        assetsDir,
        manifest,
      })

      // Only write the config file if it doesn't exist or has older content.
      try {
        await access(file)
        const oldConfig = await readFile(file, 'utf-8')
        if (config !== oldConfig) await writeFile(file, config)
      } catch (err) {
        await mkdir(wordpressConfigDir, { recursive: true })
        await writeFile(file, config)
      }
    },

    configureServer(server: ViteDevServer) {
      const { config } = server

      server.httpServer?.once('listening', () => {
        if (!config.server.origin) {
          const { https, port, host = 'localhost' } = config.server
          const resolvedHost = host === true ? '0.0.0.0' : host
          const protocol = https ? 'https' : 'http'
          config.server.origin = `${protocol}://${resolvedHost}:${port}`
        }

        writeFile(devPath, `VITE_SERVER=${config.server.origin}`)
      })

      if (!exitHandlersRegistered) {
        process.on('exit', removeDevFile)
        process.on('SIGINT', process.exit)
        process.on('SIGTERM', process.exit)
        process.on('SIGHUP', process.exit)
        exitHandlersRegistered = true
      }

      if (watch) {
        const defaultPaths = ['./*.php']
        const paths = watch === true ? defaultPaths : watch
        // @ts-ignore
        liveReload(paths).configureServer(server)
      }
    },

    buildStart() {
      removeDevFile()
    },
  }
}

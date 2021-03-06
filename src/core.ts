import * as path from 'path'
import * as copy from 'recursive-copy'

import conf from './services/conf'
import {spinner} from './services/logger'
import npm from './services/npm'
import render from './services/render'
import Watcher from './services/watcher'
import _ from './util'

const {resolve} = path

export default class Core {
  // relative path like '../' or rdt package name
  private readonly topRdtNode: string

  private readonly mappings: Mapping[]

  private readonly renderData: any

  private readonly keepWatch: boolean

  private readonly needInstall: boolean

  constructor({topRdtNode, mappings = [], renderData, keepWatch, needInstall = true}) {
    this.topRdtNode = topRdtNode
    this.mappings = mappings
    this.renderData = renderData
    this.keepWatch = keepWatch
    this.needInstall = needInstall
  }

  public async prepare() {
    spinner.start('Preparing Rde Runtime...')

    // generate rdt template from rdt chain
    const rdtConf = await this.composeRdtChain(this.topRdtNode, conf.tmpDir)

    // template render to .rde
    await this.renderDir(conf.tmpDir, rdtConf)

    // start watcher
    await this.createRuntime(rdtConf)

    spinner.stop()
  }

  public async composeRdtChain(topRdtNode, destDir: string) {
    await _.asyncExec(`rm -rf ${destDir}`)

    const {
      cwd,
      rdtConfName,
      getRdtChain,
      getRdtConfFromChain,
      getRdtDir
    } = conf

    const chain = getRdtChain(topRdtNode)
    const rdtConf = getRdtConfFromChain(chain)

    for (let node of chain) {
      const rdtDir = getRdtDir(cwd, node)
      let srcTplDir = resolve(rdtDir, 'template')

      await copy(srcTplDir, resolve(destDir, 'template'), {
        overwrite: true
      })
    }

    await render.renderTo('module', {
      obj: rdtConf
    }, resolve(destDir, rdtConfName), {
      overwrite: true
    })

    return rdtConf
  }

  public async renderDir(dir: string, rdtConf: RdtConf) {
    const srcDir = resolve(dir, 'template')
    const {render: rdtRender, dev = {render: {}}} = rdtConf
    const {includes} = rdtRender
    const dataView = this.renderData || dev.render

    await render.renderDir(srcDir, {
      ...dataView
    }, includes, conf.runtimeDir, {
      overwrite: true
    })

    await _.asyncExec(`rm -rf ${dir}`)
  }

  public async createRuntime(rdtConf: RdtConf) {
    const {cwd, runtimeDir} = conf

    const mappings = [...rdtConf.mappings, ...this.mappings]

    for (let {from, to, option} of mappings) {
      const appDir = resolve(cwd, from)
      const destDir = resolve(runtimeDir, to)

      _.copy(appDir, destDir, {option})
    }

    if (this.needInstall) {
      await npm.install('', false, runtimeDir)
    }

    if (this.keepWatch) {
      new Watcher(mappings).start()
    }
  }
}

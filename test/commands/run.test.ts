import {exec} from 'child_process'
import cli from 'cli-ux'
import * as inquirer from 'inquirer'
import * as path from 'path'
import * as sinon from 'sinon'
import * as util from 'util'

const asyncExec = util.promisify(exec)
const sandbox = sinon.createSandbox()

const {resolve} = path
const originCwd = process.cwd()
const rdtName = '@rde-pro/vue-starter-rdt'
const projectName = 'demo.project'
const cmdDir = resolve('./src/commands')
const projectDir = resolve('./test/run/', projectName)

describe('rde run', () => {
  before(async () => {
    await asyncExec('rm -rf ./test/run && mkdir ./test/run')
    process.chdir('test/run')

    // step1: rde create project
    const PromptStub = async () => rdtName
    sandbox.stub(inquirer, 'prompt').resolves({framework: 'vue'})
    sandbox.stub(cli, 'prompt').get(() => PromptStub)

    const CmdCreate = require(resolve(cmdDir, 'create')).default
    await CmdCreate.run([projectName])

    // step2: cd project && rde serve
    process.chdir(projectDir)
    const CmdServe = require(resolve(cmdDir, 'run')).default
    await CmdServe.run(['build'])
  })

  after(async () => {
    process.chdir(originCwd)
    await asyncExec('rm -rf ./test/run')

    sandbox.restore()
  })

  describe('work before run', () => {
    it('should success if rde.app.js does provide required render prop', async () => {

    })
  })
})

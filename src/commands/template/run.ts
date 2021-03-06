import Base from '../../base'
import conf from '../../services/conf'
import _ from '../../util'

export default class RdtRun extends Base {
  public static description = 'run script'

  public static examples = [
    '$ rde template:run <script>',
  ]

  public static args = [{
    name: 'cmd',
    required: true,
    description: 'scripts provided by rdt',
  }]

  public static flags = {
    ...Base.flags,
  }

  public rdtName: string

  public mappings: Mapping[]

  public cmd: string

  public renderData: any

  public needInstall: boolean

  public async preInit() {
    const {args} = this.parse(RdtRun)

    return {
      cmd: args.cmd,
    }
  }

  public async initialize({cmd}) {
    this.cmd = cmd

    this.rdtName = '../'
    this.renderData = null
    this.mappings = [
      {from: 'template', to: ''}
    ]
    this.needInstall = await this.getNeedInstall()
  }

  public async getNeedInstall(): Promise<boolean> {
    return true
  }

  public async preRun() {
    if (this.quickRun) {
      return
    }

    const core = this.getCoreInstance({
      topRdtNode: this.rdtName,
      renderData: this.renderData,
      mappings: this.mappings,
      keepWatch: this.watch,
      needInstall: this.needInstall
    })

    await core.prepare()
  }

  public async run() {
    await _.asyncSpawn('npm', ['run', `${this.cmd}`], {
      cwd: conf.runtimeDir
    })
  }
}

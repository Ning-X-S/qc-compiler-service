const fs = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')
const execSyncNew = promisify(exec)
const componentsArrTemp = [
  {
    name: 'Button',
    content: '测试'
  },
  {
    name: 'QC.Button',
    content: 'QC'
  },
  // {
  //   name: 'Text',
  //   props: {
  //     text: 'asdads'
  //   }
  // }
]
async function compile(config) {
  // 修改环境路径
  let cwd = process.cwd()
  try {
    process.chdir('../qc-pages')
    console.log(`New directory: ${process.cwd()}`)
  } catch (err) {
    console.error(`chdir: ${err}`)
    return Promise.reject(err)
  }
  let strings = fs.readFileSync('./src/App_temp.tsx', 'utf8')
  let componentsListImportString = ''
  let componentsListElementString = ''
  const componentsNameImport = []
  componentsArrTemp.forEach((item, index) => {
    const nameAndId = item.name.split('.').pop()
    if (index === 0) {
      componentsListElementString += `<${nameAndId}>${item.content}</${nameAndId}>`
    } else {
      let propsElement = ''
      if (item.props) {
        for (const key in item.props) {
          if (Object.hasOwnProperty.call(item.props, key)) {
            propsElement += ` ${key}={'${item.props[key]}'}`
          }
        }
      }
      componentsListElementString += `\n            <${nameAndId}${propsElement}>${item.content || ''}</${nameAndId}>`
    }
    if (!componentsNameImport.includes(nameAndId)) {
      componentsListImportString += `import ${nameAndId} from './nxs-ui/lib/${nameAndId.toLocaleLowerCase()}.js';\n`
      componentsNameImport.push(nameAndId)
    }
  })

  fs.writeFileSync('./src/App.tsx', changeCodeComments(strings, componentsListImportString, componentsListElementString))

  
  try {
    // 检查 static 文件是否存在，若不存在则创建 static 文件夹
    let ifStaticExist = fs.existsSync('./src/nxs-ui')
    if (!ifStaticExist) {
      fs.mkdirSync('./src/nxs-ui')
    }
    await execSyncNew(`cp -r ../nxs-ui/lib ./src/nxs-ui`, { encoding: 'utf8' })
    // if (env === 'production') {
    //   await CONFIG.webServiceStatic.reduce((a, b) => {
    //     return a.then(async () => {
    //       await execSyncNew(`rsync -avz ./static/${config.router_id} ${b}`)
    //     })
    //   }, Promise.resolve())
    // }
  } catch (err) {
    process.chdir(cwd)
    return Promise.reject(err)
  }
  try {
    const log = await execSyncNew(`npm run build`, {
      encoding: 'utf8',
      maxBuffer: 2000 * 1024,
      env: { ...process.env, 'NODE_ENV': 'production' }
    })
    console.log(log.stdout)
  } catch (err) {
    console.error(`execSyncNew: ${err}`)
    process.chdir(cwd)
    return Promise.reject(err)
  }
  try {
    // 检查 static 文件是否存在，若不存在则创建 static 文件夹
    let ifStaticExist = fs.existsSync('../../static-server/build')
    if (!ifStaticExist) {
      fs.mkdirSync('../../static-server/build')
    }
    await execSyncNew(`cp -r ./build/ ../../static-server/build`, { encoding: 'utf8' })
    // if (env === 'production') {
    //   await CONFIG.webServiceStatic.reduce((a, b) => {
    //     return a.then(async () => {
    //       await execSyncNew(`rsync -avz ./static/${config.router_id} ${b}`)
    //     })
    //   }, Promise.resolve())
    // }
  } catch (err) {
    process.chdir(cwd)
    return Promise.reject(err)
  }
};

(async () => {
  await compile()
})();

function changeCodeComments(code, importStr, element) {
  var reg = /\/\* PLACEHOLDER_IMPORT \*\//
  var regELement = /\/\* PLACEHOLDER_ELEMENT \*\//
  var result = code.replace(reg, importStr).replace(regELement, element)
  return result
}
import { camelCase } from 'lodash'
import { resolve } from 'path'
import { Icons } from '../types'

export interface Icon {
  width: number
  height: number
  svgPathData: string
}

export interface Tags {
  [key: string]: string
}

export function generateSVG(icon: Icon, tag: string): string {
  const { width, height, svgPathData } = icon

  return `
    <svg id="${tag}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <path fill="currentColor" d="${svgPathData}"></path>
    </svg>
  `
}

export async function loadFontAwesomeIcons(icons: Icons, toLoad: Array<string>): Promise<void> {
  const dependencies: { [key: string]: string } = require(resolve(process.cwd(), './package.json')).dependencies

  icons.tags = toLoad.reduce<Tags>((accu, entry, index) => {
    // Manipulate the icon name - Syntax: [alias@]<icon>[:section]
    const [alias, rawName] = entry.includes('@') ? entry.split('@') : [entry.replace(/:.+/, ''), entry]
    const [name, section] = rawName.includes(':') ? rawName.split(':') : [rawName, 'solid']
    const tag = `i${index}`
    const iconPackage = `@fortawesome/free-${section}-svg-icons`

    // Check font-awesome exists in dependencies
    if (!dependencies.hasOwnProperty(iconPackage)) {
      throw new Error(
        `In order to load the "${entry}" icon, please add ${iconPackage} to the package.json dependencies.`
      )
    }

    // Load the icon then add to the definitions
    const icon = require(resolve(process.cwd(), `node_modules/${iconPackage}/${camelCase(`fa_${name}`)}`))
    icons.definitions += generateSVG(icon, tag)
    accu[alias] = tag

    return accu
  }, {})
}

// const name = '*hi* Soham *h*\n, _Hello_ *i am bold*'

// const emailParser = (name) => {
//   const regex = /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/
//   name = regex.exec(name)
//   return { inputString: name[0], name: name[1], emailId: name[2] }
// }

const makeBold = (name) => {
  const i1 = name.indexOf('*')
  const i2 = name.indexOf('*', i1 + 1)
  if (i1 > -1 && i2 > i1) {
    name = name.replace('*', '<b>').replace('*', '</b')
    return makeBold(name)
  } else {
    return name
  }
}

const makeItalic = (name) => {
  const i1 = name.indexOf('_')
  const i2 = name.indexOf('_', i1 + 1)
  if (i1 > -1 && i2 > i1) {
    name = name.replace('_', '<i>').replace('_', '</i>')
    return makeBold(name)
  } else {
    return name
  }
}

const newLineParser = (name) => {
  name = name.replace(/[\n]/g, '<br>')
}

module.exports = (str) => {
  if (str) {
    str = makeBold(str)
    str = makeItalic(str)
    str = newLineParser(str)
    return str
  }
}

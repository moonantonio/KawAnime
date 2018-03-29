import _ from 'lodash'

export default function (subtitle, styles, info) {
  // Following the ass-specs http://www.cccp-project.net/stuff/ass-specs.pdf
  const { time, duration, text } = subtitle
  const result = new window.VTTCue(time / 1000, (time + duration) / 1000, text)

  const resX = +info.PlayResX
  const resY = +info.PlayResY

  const unitX = resX / 100 // Border between 5 and 95.
  const unitY = resY / 16

  // First we need to set the current subtitle style if any.
  const style = _.filter(styles, (style) => style.Name === subtitle.style)[0] // findStyleByName(subtitle.style, styles)

  const alignment = +style.Alignment

  // For position style, need to handle Margin(L|R|V),
  // Alignment, Font-size, Italic, Spacing?, Underline

  // First, Margins
  const mR = +style.MarginR
  const mL = +style.MarginL
  const mV = +style.MarginV

  // Horizontally
  if (mR === mL) {
    result.position = 'auto'
  } else {
    result.position = !mL
      ? 95 - Math.round(mR / unitX)
      : 5 + Math.round(mL / unitX)
  }

  // Vertical-alignment. We assume that the file is unicoded.
  const isTop = _.inRange(alignment, 7, 10)
  const isBot = _.inRange(alignment, 1, 4)

  const offsetY = Math.round(mV / unitY)

  if (isTop) {
    // Distance is taken from the top
    result.line = offsetY
  } else if (isBot) {
    // Distance is taken from the bottom
    result.line = 16 - offsetY
  } else {
    // Should be vertically centered
    result.line = 8
  }

  subtitle.text === 'Register' && console.log(subtitle, style, result)

  // Horizontal-alignment. We assume that the file is unicoded.
  const leftAligned = [1, 4, 7]
  const rightAligned = [3, 6, 9]

  result.align = leftAligned.includes(alignment)
    ? 'start'
    : rightAligned.includes(alignment)
      ? 'end'
      : 'center'

  // const isItalic = +style.Italic
  // const isBold = +style.Bold
  // const isUnderline = -+style.Underline

  // We should handle tags now
  let string = text

  // Getting those line breaks
  string = string.replace(/\\N/g, '\n')

  // an<pos> tag
  const reAn = /\{\\an[0-9]\}/g

  const indexToPos = {
    1: [13, 15], // Bottom left
    2: [13, 50], // Bottom center
    3: [13, 85], // Bottom right
    4: [7, 15], // Middle left
    5: [7, 50], // Middle center
    6: [7, 85], // Middle right
    7: [1, 15], // Top left
    8: [1, 50], // Top center
    9: [1, 85] // Top right
  }

  if (reAn.test(string)) {
    const index = +string.match(reAn)[0][4]

    result.line = indexToPos[index][0]
    result.position = indexToPos[index][1]

    string = string.replace(reAn, '')
  }

  // fad<in, out> tag
  const reFad = /\{\\fad\([0-9]*,[0-9]*\)\}/
  string = string.replace(reFad, '')

  // if (reFad.test(string)) {
  //   const tag = string.match(reFad)[0]
  //   const fIn = tag.split(',')[0].slice(6)
  //   const fOut = tag.split(',')[1].slice(0, -2)
  // }

  result.text = string

  return result
}

import { createEffect, onMount, type Component } from 'solid-js';
import * as PIXI from 'pixi.js';

const BmsCanvas: Component<{ data: any, params: any }> = (props) => {
      // グローバル変数
  var leftMargin = 20
  var rightMargin = leftMargin
  var bottomMargin = 10
  var headerHeight = 20
  var thumbnailHeight = 50
  var renderer: PIXI.Renderer | null = null
  var base: PIXI.Container | null = null
  var stage: PIXI.Container | null  = null
  var thumbnail: PIXI.Container | null  = null
  var measures: any[] = []

  // - レンダリングパラメータ
  var scaleW = 7
  var scaleH = 2
  var playSide = 1
  var pattern: any = null
  var measureFrom = 0
  var measureTo = 0
  var colorScheme = "default"

  // 定数
  var measureGridSize = {
    5: 19,
    7: 23,
    9: 22,
    10: 34,
    14: 42,
  }
  var measureLeftLaneSize = {
    5: measureGridSize[5] - 4,
    7: measureGridSize[7] - 4,
    9: measureGridSize[9] - 4,
    10: (measureGridSize[10] - 4) / 2,
    14: (measureGridSize[14] - 4) / 2,
  }

  var keyCh = {
    5: ["11", "12", "13", "14", "15"],
    7: ["11", "12", "13", "14", "15", "18", "19"],
    9: ["11", "12", "13", "14", "15", "22", "23", "24", "25"],
    10: [
      ["11", "12", "13", "14", "15"],
      ["21", "22", "23", "24", "25"],
    ],
    14: [
      ["11", "12", "13", "14", "15", "18", "19"],
      ["21", "22", "23", "24", "25", "28", "29"],
    ],
  }
  var schemes = {
    default: {
      backgroundFill: 0x000000,
      outerBound: 0xffffff,
      quarterLine: 0x808080,
      sixteenthLine: 0x404040,
      laneLine: 0x404040,
      labelFill: 0x808080,
      labelText: 0xffffff,
      bpmLine: 0x00ff00,
      bpmText: 0x00ff00,
      bpmTextStroke: 0x808080,
      stopLine: 0xff0000,
      stopText: null,
      stopTextStroke: null,
      noteBlueFill: 0x5074fe,
      noteBlueLine: null,
      noteWhiteFill: 0xbebebe,
      noteWhiteLine: null,
      noteRedFill: 0xe04a4a,
      noteRedLine: null,
      lnoteBlueFill: 0xb0c0ff,
      lnoteBlueLine: null,
      lnoteWhiteFill: 0xe6ffc2,
      lnoteWhiteLine: null,
      lnoteRedFill: 0xff9a9a,
      lnoteRedLine: null,
      mineRedFill: 0x700000,
      mineRedLine: 0x700000,
      lnWidthRatio: 0,
      bpmLineH: 1,
    },
    mono: {
      backgroundFill: 0xffffff,
      outerBound: 0x000000,
      quarterLine: 0x7f7f7f,
      sixteenthLine: 0xbfbfbf,
      laneLine: 0x7f7f7f,
      labelFill: 0xffffff,
      labelText: 0x000000,
      bpmText: 0x000000,
      bpmTextStroke: 0xffffff,
      stopLine: 0x000000,
      stopText: 0x000000,
      stopTextStroke: 0xffffff,
      noteBlueFill: 0x000000,
      noteBlueLine: 0x000000,
      noteWhiteFill: 0xffffff,
      noteWhiteLine: 0x000000,
      noteRedFill: 0x000000,
      noteRedLine: 0x000000,
      lnoteBlueFill: 0x000000,
      lnoteBlueLine: 0x000000,
      lnoteWhiteFill: 0xffffff,
      lnoteWhiteLine: 0x000000,
      lnoteRedFill: 0xffffff,
      lnoteRedLine: 0x000000,
      mineRedFill: 0x7f7f7f,
      mineRedLine: 0x7f7f7f,
      lnWidthRatio: 0.8,
      bpmLineH: 2,
    },
  }

  // 小節オブジェク�?
  function Measure(param: any) {
    var lineWidth = 1
    var container = new PIXI.Container()
    var g = new PIXI.Graphics()
    container.addChild(g)

    // コン�?��サイズを決�?
    container.innerHeight = g.innerHeight = param.length * param.scaleH * param.exratio
    container.innerWidth = g.innerWidth = measureGridSize[param.keys] * param.scaleW

    // パラメータをセ�?��
    g.logicalLength = param.length
    g.unitLength = param.unit
    g.index = param.index
    g.score = param.score
    g.lnmap = param.lnmap
    g.keys = param.keys
    g.gridX = param.scaleW
    g.gridY = g.innerHeight / g.logicalLength
    g.side = param.side
    g.pattern = param.pattern

    // 外枠描画メソ�?��
    g.drawOuterBound = function () {
      g.lineStyle(lineWidth, schemes[colorScheme].outerBound, 1)
      g.moveTo(-lineWidth, 0)
      g.lineTo(g.innerWidth + lineWidth, 0)
      g.lineTo(g.innerWidth + lineWidth, g.innerHeight - lineWidth)
      g.lineTo(-lineWidth, g.innerHeight - lineWidth)
      g.lineTo(-lineWidth, -1)
    }

    // 小節線描画メソ�?��
    g.drawMeasureLines = function () {
      var grid = g.innerHeight / g.logicalLength
      for (var i = 1; (i * g.unitLength) / 16 < g.logicalLength; i++) {
        var color = schemes[colorScheme].sixteenthLine //  16�?��符
        if (i % 4 == 0) {
          color = schemes[colorScheme].quarterLine
        } // 4�?��符
        g.lineStyle(lineWidth, color, 1)
        g.moveTo(-1, g.innerHeight - (grid * i * g.unitLength) / 16 - lineWidth)
        g.lineTo(g.innerWidth, g.innerHeight - (grid * i * g.unitLength) / 16 - lineWidth)
      }
    }

    // ノ�?ト�?��線描画メソ�?��
    g.drawNoteLines = function () {
      switch (g.keys) {
        case 5:
        case 7:
          g.drawNoteLinesSP(g.keys)
          break
        case 9:
          g.drawNoteLinesPMS(9)
          break
        case 10:
        case 14:
          g.drawNoteLinesDP(g.keys)
          break
        default:
          break
      }
    }

    // ノ�?ト�?��線DP
    g.drawNoteLinesDP = function (keys) {
      // ノ�?ト�?��線を描画
      // SC:5, KEY:2, LABEL:2
      var grid = g.gridX
      var color = schemes[colorScheme].laneLine
      var idx = 5
      // SC1
      g.lineStyle(lineWidth, color, 1)
      g.moveTo(grid * idx, 0)
      g.lineTo(grid * idx, g.innerHeight - lineWidth)
      // KEY1P 1-7
      for (var i = 0; i < keys / 2; i++) {
        idx += 2
        g.moveTo(grid * idx, 0)
        g.lineTo(grid * idx, g.innerHeight - lineWidth)
      }
      // LABEL
      idx = keys + 5
      color = schemes[colorScheme].labelFill
      g.beginFill(color)
      g.lineStyle(0, null, 1)
      g.moveTo(grid * idx, 0)
      g.lineTo(grid * idx, g.innerHeight - lineWidth)
      g.lineTo(grid * (4 + idx), g.innerHeight - lineWidth)
      g.lineTo(grid * (4 + idx), 0)
      g.endFill()
      if (g.logicalLength >= g.unitLength / 4 / param.scaleH) {
        idx += 2
        var labelText = new PIXI.Text(g.index, {
          fontFamily: "Arial",
          fontSize: grid * 2,
          fontWeight: "bold",
          fill: schemes[colorScheme].labelText,
        })
        labelText.anchor.x = 0.5
        labelText.anchor.y = 0.5
        labelText.x = grid * idx
        labelText.y = g.innerHeight / 2
        container.addChild(labelText)
      }
      // KEY2P
      idx += 2
      color = schemes[colorScheme].laneLine
      g.lineStyle(lineWidth, color, 1)
      g.moveTo(grid * idx, 0)
      g.lineTo(grid * idx, g.innerHeight - lineWidth)
      for (var i = 0; i < keys / 2; i++) {
        idx += 2
        g.moveTo(grid * idx, 0)
        g.lineTo(grid * idx, g.innerHeight - lineWidth)
      }
    }
    // ノ�?ト�?��線SP
    g.drawNoteLinesSP = function (keys) {
      // ノ�?ト�?��線を描画
      // SC:5, KEY:2, LABEL:2
      var grid = g.gridX
      var color = schemes[colorScheme].laneLine
      var idx = g.side == 1 ? 5 : 2 * keys + 5
      // SC
      g.lineStyle(lineWidth, color, 1)
      g.moveTo(grid * idx, 0)
      g.lineTo(grid * idx, g.innerHeight - lineWidth)
      // KEY
      if (g.side == 2) idx = 0
      for (var i = 0; i < keys; i++) {
        idx += 2
        g.moveTo(grid * idx, 0)
        g.lineTo(grid * idx, g.innerHeight - lineWidth)
      }
      // LABEL
      idx = 2 * keys + 5
      color = schemes[colorScheme].labelFill
      g.beginFill(color)
      g.lineStyle(0, null, 1)
      g.moveTo(grid * idx, 0)
      g.lineTo(grid * idx, g.innerHeight - lineWidth)
      g.lineTo(grid * (4 + idx), g.innerHeight - lineWidth)
      g.lineTo(grid * (4 + idx), 0)
      g.endFill()
      if (g.logicalLength >= g.unitLength / 4 / param.scaleH) {
        idx += 2
        var labelText = new PIXI.Text(g.index, {
          fontFamily: "Arial",
          fontSize: grid * 2,
          fontWeight: "bold",
          fill: schemes[colorScheme].labelText,
        })
        labelText.anchor.x = 0.5
        labelText.anchor.y = 0.5
        labelText.x = grid * idx
        labelText.y = g.innerHeight / 2
        container.addChild(labelText)
      }
    }
    // ノ�?ト�?��線PMS
    g.drawNoteLinesPMS = function (keys) {
      var idx = 0
      var grid = g.gridX
      var color = schemes[colorScheme].laneLine
      g.lineStyle(lineWidth, color, 1)
      // KEY
      for (var i = 0; i < keys; i++) {
        idx += 2
        g.moveTo(grid * idx, 0)
        g.lineTo(grid * idx, g.innerHeight - lineWidth)
      }
      // LABEL
      idx = 2 * keys
      color = schemes[colorScheme].labelFill
      g.beginFill(color)
      g.lineStyle(0, null, 1)
      g.moveTo(grid * idx, 0)
      g.lineTo(grid * idx, g.innerHeight - lineWidth)
      g.lineTo(grid * (4 + idx), g.innerHeight - lineWidth)
      g.lineTo(grid * (4 + idx), 0)
      g.endFill()
      if (g.logicalLength >= g.unitLength / 4 / param.scaleH) {
        idx += 2
        var labelText = new PIXI.Text(g.index, {
          fontFamily: "Arial",
          fontSize: grid * 2,
          fontWeight: "bold",
          fill: schemes[colorScheme].labelText,
        })
        labelText.anchor.x = 0.5
        labelText.anchor.y = 0.5
        labelText.x = grid * idx
        labelText.y = g.innerHeight / 2
        container.addChild(labelText)
      }
    }

    // ノ�?ト描画メソ�?��
    g.drawNotes = function () {
      switch (g.keys) {
        case 5:
        case 7:
          g.drawNotesSP(g.keys)
          break
        case 9:
          g.drawNotesPMS(g.keys)
          break
        case 10:
        case 14:
          g.drawNotesDP(g.keys)
          break
        default:
          break
      }
    }
    // ノ�?�?DP
    g.drawNotesDP = function (keys) {
      // レーン入れ替�?
      var keych1P = keyCh[keys][0]
      var keych2P = keyCh[keys][1]
      var scch1P = "16"
      var scch2P = "26"
      if (g.side == 2) {
        // FLIP
        var temp = keych1P
        keych1P = keych2P
        keych2P = temp
        temp = scch1P
        scch1P = scch2P
        scch2P = temp
      }
      if (g.pattern != null && g.pattern.length == keys) {
        var temp1 = keych1P
        var temp2 = keych2P
        keych1P = []
        keych2P = []
        for (var i = 0; i < keys / 2; i++) {
          keych1P.push(temp1[g.pattern[i]])
          keych2P.push(temp2[g.pattern[i + keys / 2]])
        }
      }

      // ノ�?ト描画
      var noteThickness = 4
      var blue = schemes[colorScheme].noteBlueFill
      var white = schemes[colorScheme].noteWhiteFill
      var red = schemes[colorScheme].noteRedFill
      var blueLine = schemes[colorScheme].noteBlueLine
      var whiteLine = schemes[colorScheme].noteWhiteLine
      var redLine = schemes[colorScheme].noteRedLine
      var lnWhite = schemes[colorScheme].lnoteWhiteFill
      var lnBlue = schemes[colorScheme].lnoteBlueFill
      var lnRed = schemes[colorScheme].lnoteRedFill
      var lnWhiteLine = schemes[colorScheme].lnoteWhiteLine
      var lnBlueLine = schemes[colorScheme].lnoteBlueLine
      var lnRedLine = schemes[colorScheme].lnoteRedLine
      var mineRed = schemes[colorScheme].mineRedFill
      var mineRedLine = schemes[colorScheme].mineRedLine
      var lnRatio = schemes[colorScheme].lnWidthRatio

      // KEY
      ;[
        [5, keych1P],
        [keys + 9, keych2P],
      ].forEach(function (p) {
        var idx = p[0]
        var color = blue
        var colorLine = blueLine
        var lnColor = lnBlue
        var lnColorLine = lnWhiteLine
        p[1].forEach(function (key) {
          if (color == blue) {
            color = white
            colorLine = whiteLine
          } else {
            color = blue
            colorLine = blueLine
          }
          if (lnColor == lnBlue) {
            lnColor = lnWhite
            lnColorLine = lnWhiteLine
          } else {
            lnColor = lnBlue
            lnColorLine = lnBlueLine
          }

          if (key in g.lnmap) {
            g.lnmap[key].forEach(function (area) {
              if (area[0][0] <= g.index && area[1][0] >= g.index) {
                var lnBegin = 0
                var lnEnd = g.logicalLength
                if (area[0][0] == g.index) {
                  lnBegin = area[0][1]
                }
                if (area[1][0] == g.index) {
                  lnEnd = area[1][1]
                }
                var noteLineWidth = lnColorLine != null ? 1 : 0
                var noteLineAlpha = lnColorLine != null ? 1 : 0
                g.beginFill(lnColor)
                g.lineStyle(noteLineWidth, lnColorLine, noteLineAlpha)
                g.drawRect(
                  idx * g.gridX - (idx == 0 ? lineWidth : 0) + (lnRatio * g.gridX) / 2,
                  g.innerHeight - g.gridY * lnEnd - lineWidth + (lnEnd == g.logicalLength ? noteLineWidth : 0),
                  2 * g.gridX - (idx == 0 ? 0 : lineWidth) - lnRatio * g.gridX,
                  g.gridY * (lnEnd - lnBegin) +
                    (lnBegin == 0 ? lineWidth : 0) -
                    lineWidth -
                    (lnEnd == g.logicalLength ? noteLineWidth : 0)
                )
                g.endFill()
              }
            })
          }
          ;[
            [(key.charAt(0) == "1" ? "D" : "E") + key.charAt(1), mineRed, mineRedLine],
            [key, color, colorLine],
          ].forEach(function (q) {
            var _key = q[0]
            var _color = q[1]
            var _colorLine = q[2]
            if (g.score && _key in g.score) {
              g.score[_key].forEach(function (pos) {
                var noteLineWidth = _colorLine != null ? 1 : 0
                var noteLineAlpha = _colorLine != null ? 1 : 0
                g.beginFill(_color)
                g.lineStyle(noteLineWidth, _colorLine, noteLineAlpha)
                g.drawRect(
                  idx * g.gridX - (idx == 0 ? lineWidth : 0),
                  g.innerHeight - (g.gridY * pos[0] + noteThickness) - lineWidth,
                  2 * g.gridX - (idx == 0 ? 0 : lineWidth) + noteLineWidth,
                  noteThickness
                )
                g.endFill()
              })
            }
          })
          idx += 2
        })
      })

      // SC
      ;[
        [0, scch1P],
        [2 * keys + 9, scch2P],
      ].forEach(function (p) {
        var idx = p[0]
        var color = red
        var colorLine = red
        var lnColor = lnRed
        var lnColorLine = lnRedLine
        if (p[1] in g.lnmap) {
          g.lnmap[p[1]].forEach(function (area) {
            if (area[0][0] <= g.index && area[1][0] >= g.index) {
              var lnBegin = 0
              var lnEnd = g.logicalLength
              if (area[0][0] == g.index) {
                lnBegin = area[0][1]
              }
              if (area[1][0] == g.index) {
                lnEnd = area[1][1]
              }
              var noteLineWidth = lnColorLine != null ? 1 : 0
              var noteLineAlpha = lnColorLine != null ? 1 : 0
              g.beginFill(lnColor)
              g.lineStyle(noteLineWidth, lnColorLine, noteLineAlpha)
              g.drawRect(
                idx * g.gridX - (idx == 0 ? lineWidth : 0) + (lnRatio * g.gridX) / 2,
                g.innerHeight - g.gridY * lnEnd - lineWidth + (lnEnd == g.logicalLength ? noteLineWidth : 0),
                5 * g.gridX - lnRatio * g.gridX,
                g.gridY * (lnEnd - lnBegin) +
                  (lnBegin == 0 ? lineWidth : 0) -
                  lineWidth -
                  (lnEnd == g.logicalLength ? noteLineWidth : 0)
              )
              g.endFill()
            }
          })
        }
        ;[
          [(p[1].charAt(0) == "1" ? "D" : "E") + p[1].charAt(1), mineRed, mineRedLine],
          [p[1], color, colorLine],
        ].forEach(function (q) {
          var _key = q[0]
          var _color = q[1]
          var _colorLine = q[2]
          if (g.score && _key in g.score) {
            g.score[_key].forEach(function (pos) {
              var noteLineWidth = _colorLine != null ? 1 : 0
              var noteLineAlpha = _colorLine != null ? 1 : 0
              g.beginFill(_color)
              g.lineStyle(noteLineWidth, _colorLine, noteLineAlpha)
              g.drawRect(
                idx * g.gridX - (idx == 0 ? lineWidth : 0),
                g.innerHeight - (g.gridY * pos[0] + noteThickness) - lineWidth,
                5 * g.gridX + noteLineWidth,
                noteThickness
              )
              g.endFill()
            })
          }
        })
      })
    }
    // ノ�?�?SP
    g.drawNotesSP = function (keys) {
      // レーン入れ替�?
      var keych = keyCh[keys]
      if (g.pattern != null && g.pattern.length == keys) {
        var temp = keych
        keych = []
        for (var i = 0; i < keys; i++) {
          keych.push(temp[g.pattern[i]])
        }
      }

      // ノ�?ト描画
      var noteThickness = 4
      var blue = schemes[colorScheme].noteBlueFill
      var white = schemes[colorScheme].noteWhiteFill // 0x8b8b8b
      var red = schemes[colorScheme].noteRedFill
      var blueLine = schemes[colorScheme].noteBlueLine
      var whiteLine = schemes[colorScheme].noteWhiteLine
      var redLine = schemes[colorScheme].noteRedLine
      var lnWhite = schemes[colorScheme].lnoteWhiteFill
      var lnBlue = schemes[colorScheme].lnoteBlueFill
      var lnRed = schemes[colorScheme].lnoteRedFill
      var lnWhiteLine = schemes[colorScheme].lnoteWhiteLine
      var lnBlueLine = schemes[colorScheme].lnoteBlueLine
      var lnRedLine = schemes[colorScheme].lnoteRedLine
      var mineRed = schemes[colorScheme].mineRedFill
      var mineRedLine = schemes[colorScheme].mineRedLine
      var lnRatio = schemes[colorScheme].lnWidthRatio

      // KEY
      var idx = g.side == 1 ? 5 : 0
      var color = blue
      var colorLine = blueLine
      var lnColor = lnBlue
      var lnColorLine = lnBlueLine
      keych.forEach(function (key) {
        if (color == blue) {
          color = white
          colorLine = whiteLine
        } else {
          color = blue
          colorLine = blueLine
        }
        if (lnColor == lnBlue) {
          lnColor = lnWhite
          lnColorLine = lnWhiteLine
        } else {
          lnColor = lnBlue
          lnColorLine = lnBlueLine
        }

        if (key in g.lnmap) {
          g.lnmap[key].forEach(function (area) {
            if (area[0][0] <= g.index && area[1][0] >= g.index) {
              var lnBegin = 0
              var lnEnd = g.logicalLength
              if (area[0][0] == g.index) {
                lnBegin = area[0][1]
              }
              if (area[1][0] == g.index) {
                lnEnd = area[1][1]
              }
              var noteLineWidth = lnColorLine != null ? 1 : 0
              var noteLineAlpha = lnColorLine != null ? 1 : 0
              g.beginFill(lnColor)
              g.lineStyle(noteLineWidth, lnColorLine, noteLineAlpha)
              g.drawRect(
                idx * g.gridX - (idx == 0 ? lineWidth : 0) + (lnRatio * g.gridX) / 2,
                g.innerHeight - g.gridY * lnEnd - lineWidth + (lnEnd == g.logicalLength ? noteLineWidth : 0),
                2 * g.gridX - (idx == 0 ? 0 : lineWidth) - lnRatio * g.gridX,
                g.gridY * (lnEnd - lnBegin) +
                  (lnBegin == 0 ? lineWidth : 0) -
                  lineWidth -
                  (lnEnd == g.logicalLength ? noteLineWidth : 0)
              )
              g.endFill()
            }
          })
        }
        ;[
          ["D" + key.charAt(1), mineRed, mineRed],
          [key, color, colorLine],
        ].forEach(function (q) {
          var _key = q[0]
          var _color = q[1]
          var _colorLine = q[2]
          if (g.score && _key in g.score) {
            g.score[_key].forEach(function (pos) {
              var noteLineWidth = _colorLine != null ? 1 : 0
              var noteLineAlpha = _colorLine != null ? 1 : 0
              g.beginFill(_color)
              g.lineStyle(noteLineWidth, _colorLine, noteLineAlpha)
              g.drawRect(
                idx * g.gridX - (idx == 0 ? lineWidth : 0),
                g.innerHeight - (g.gridY * pos[0] + noteThickness) - lineWidth,
                2 * g.gridX - (idx == 0 ? 0 : lineWidth) + noteLineWidth,
                noteThickness
              )
              g.endFill()
            })
          }
        })
        idx += 2
      })

      // SC
      idx = g.side == 1 ? 0 : 2 * keys
      color = red
      colorLine = redLine
      lnColor = lnRed
      lnColorLine = lnRedLine
      if ("16" in g.lnmap) {
        g.lnmap["16"].forEach(function (area) {
          if (area[0][0] <= g.index && area[1][0] >= g.index) {
            var lnBegin = 0
            var lnEnd = g.logicalLength
            if (area[0][0] == g.index) {
              lnBegin = area[0][1]
            }
            if (area[1][0] == g.index) {
              lnEnd = area[1][1]
            }
            var noteLineWidth = lnColorLine != null ? 1 : 0
            var noteLineAlpha = lnColorLine != null ? 1 : 0
            g.beginFill(lnColor)
            g.lineStyle(noteLineWidth, lnColorLine, noteLineAlpha)
            g.drawRect(
              idx * g.gridX - (idx == 0 ? lineWidth : 0) + (lnRatio * g.gridX) / 2,
              g.innerHeight - g.gridY * lnEnd - lineWidth + (lnEnd == g.logicalLength ? noteLineWidth : 0),
              5 * g.gridX - (idx == 0 ? 0 : lineWidth) - lnRatio * g.gridX,
              g.gridY * (lnEnd - lnBegin) +
                (lnBegin == 0 ? lineWidth : 0) -
                lineWidth -
                (lnEnd == g.logicalLength ? noteLineWidth : 0)
            )
            g.endFill()
          }
        })
      }
      ;[
        ["D6", mineRed, mineRedLine],
        ["16", color, colorLine],
      ].forEach(function (q) {
        var _key = q[0]
        var _color = q[1]
        var _colorLine = q[2]
        if (g.score && _key in g.score) {
          g.score[_key].forEach(function (pos) {
            var noteLineWidth = _colorLine != null ? 1 : 0
            var noteLineAlpha = _colorLine != null ? 1 : 0
            g.beginFill(_color)
            g.lineStyle(noteLineWidth, _colorLine, noteLineAlpha)
            g.drawRect(
              idx * g.gridX - (idx == 0 ? lineWidth : 0),
              g.innerHeight - (g.gridY * pos[0] + noteThickness) - lineWidth,
              5 * g.gridX - (idx == 0 ? 0 : lineWidth) + noteLineWidth,
              noteThickness
            )
            g.endFill()
          })
        }
      })
    }
    // ノ�?�?PMS
    g.drawNotesPMS = function (keys) {
      // レーン入れ替�?
      var keych = keyCh[keys]
      if (g.pattern != null && g.pattern.length == keys) {
        var temp = keych
        keych = []
        for (var i = 0; i < keys; i++) {
          keych.push(temp[g.pattern[i]])
        }
      }

      // ノ�?ト描画
      var schemes = [0xc4c4c4, 0xfff500, 0x99ff67, 0x30b9f9, 0xff6c6c, 0x30b9f9, 0x99ff67, 0xfff500, 0xc4c4c4]
      var lncolors = [0x909090, 0xc5b400, 0x00ab1e, 0x006bd5, 0xd60000, 0x006bd5, 0x00ab1e, 0xc5b400, 0x909090]
      var mineRed = 0x700000
      var barThickness = 3
      var noteRadius = 3
      var noteThickness = barThickness * 3

      // KEY
      var idx = 0
      keych.forEach(function (key, i) {
        // LN
        if (key in g.lnmap) {
          g.lnmap[key].forEach(function (area) {
            if (area[0][0] <= g.index && area[1][0] >= g.index) {
              var lnBegin = 0
              var lnEnd = g.logicalLength
              if (area[0][0] == g.index) {
                lnBegin = area[0][1]
              }
              if (area[1][0] == g.index) {
                lnEnd = area[1][1]
              }

              g.beginFill(lncolors[i])
              g.lineStyle(0, null, 1)
              g.drawRect(
                idx * g.gridX - (idx == 0 ? lineWidth : 0) + (i % 2 == 0 ? 0 : 1),
                g.innerHeight - g.gridY * lnEnd - lineWidth,
                2 * g.gridX - (idx == 0 ? 0 : lineWidth) - 2 * (i % 2 == 0 ? 0 : 1),
                g.gridY * (lnEnd - lnBegin) + (lnBegin == 0 ? lineWidth : 0)
              )
            }
          })
        }
        ;[
          [(key.charAt(0) == "1" ? "D" : "E") + key.charAt(1), mineRed],
          [key, schemes[i]],
        ].forEach(function (q) {
          var _key = q[0]
          var _color = q[1]
          if (g.score && _key in g.score) {
            g.score[_key].forEach(function (pos) {
              // note
              g.beginFill(_color)
              g.lineStyle(0, null, 1)
              g.drawRoundedRect(
                idx * g.gridX - (idx == 0 ? lineWidth : 0) + (i % 2 == 0 ? 0 : 1),
                g.innerHeight - (g.gridY * pos[0] + (barThickness + noteThickness) / 2) - lineWidth,
                2 * g.gridX - (idx == 0 ? 0 : lineWidth) - 2 * (i % 2 == 0 ? 0 : 1),
                noteThickness,
                noteRadius
              )
              g.endFill()

              // bar
              g.beginFill(0xffffff)
              g.lineStyle(0, null, 1)
              g.drawRect(
                idx * g.gridX - (idx == 0 ? lineWidth : 0) + (i % 2 == 0 ? 0 : 1),
                g.innerHeight - (g.gridY * pos[0] + barThickness) - lineWidth,
                2 * g.gridX - (idx == 0 ? 0 : lineWidth) - 2 * (i % 2 == 0 ? 0 : 1),
                barThickness
              )
              g.endFill()
            })
          }
        })
        idx += 2
      })
    }

    // BPM描画メソ�?��
    g.drawBPM = function () {
      var colorLine = schemes[colorScheme].bpmLine
      var colorText = schemes[colorScheme].bpmText
      var colorStroke = schemes[colorScheme].bpmTextStroke
      var lineH = schemes[colorScheme].bpmLineH
      // BPM, exBPM
      var ch = ["03", "08"]
      ch.forEach(function (key) {
        if (g.score && key in g.score) {
          g.score[key].forEach(function (pos) {
            g.lineStyle(lineH, colorLine, 1)
            g.moveTo(-1, g.innerHeight - g.gridY * pos[0] - lineH)
            g.lineTo(g.gridX * measureLeftLaneSize[g.keys], g.innerHeight - g.gridY * pos[0] - lineH)

            if (g.keys == 10 || g.keys == 14) {
              // for DP
              g.moveTo(
                g.gridX * (measureGridSize[g.keys] - measureLeftLaneSize[g.keys]),
                g.innerHeight - g.gridY * pos[0] - lineH
              )
              g.lineTo(g.gridX * measureGridSize[g.keys], g.innerHeight - g.gridY * pos[0] - lineH)
            }
            if (colorText != null) {
              var labelText = new PIXI.Text(Math.round(pos[1] * 10) / 10, {
                fontFamily: "Arial",
                fontSize: g.gridX * 1.5,
                fontWeight: "bold",
                fill: colorText,
                stroke: colorStroke,
                strokeThickness: colorStroke != null ? 2 : 0,
              })
              labelText.anchor.x = 0.5
              labelText.anchor.y = 0.5
              labelText.x = g.gridX * (measureLeftLaneSize[g.keys] + 2)
              labelText.y = g.innerHeight - g.gridY * pos[0] - lineWidth
              container.addChild(labelText)
            }
          })
        }
      })
    }

    // STOP描画メソ�?��
    g.drawStop = function () {
      var colorLine = schemes[colorScheme].stopLine
      var colorText = schemes[colorScheme].stopText
      var colorStroke = schemes[colorScheme].stopTextStroke
      var lineH = schemes[colorScheme].bpmLineH
      // STOP
      var ch = ["09"]
      ch.forEach(function (key) {
        if (g.score && key in g.score) {
          g.score[key].forEach(function (pos) {
            g.lineStyle(lineH, colorLine, 1)
            g.moveTo(-1, g.innerHeight - g.gridY * pos[0] - lineH)
            g.lineTo(g.gridX * measureLeftLaneSize[g.keys], g.innerHeight - g.gridY * pos[0] - lineH)

            if (g.keys == 10 || g.keys == 14) {
              // for DP
              g.moveTo(
                g.gridX * (measureGridSize[g.keys] - measureLeftLaneSize[g.keys]),
                g.innerHeight - g.gridY * pos[0] - lineH
              )
              g.lineTo(g.gridX * measureGridSize[g.keys], g.innerHeight - g.gridY * pos[0] - lineH)
            }

            if (colorText != null) {
              var labelText = new PIXI.Text(/*Math.round(pos[1] * 10 / 48) / 10*/ "S", {
                fontFamily: "Arial",
                fontSize: g.gridX * 1.75,
                fontWeight: "bold",
                fill: colorText,
                stroke: colorStroke,
                strokeThickness: colorStroke != null ? 2 : 0,
              })
              labelText.anchor.x = 0.5
              labelText.anchor.y = 0.5
              labelText.x = g.gridX * (measureLeftLaneSize[g.keys] + 2)
              labelText.y = g.innerHeight - g.gridY * pos[0] - lineWidth
              container.addChild(labelText)
            }
          })
        }
      })
    }

    // 描画
    g.drawMeasureLines()
    g.drawNoteLines()
    g.drawOuterBound()
    g.drawBPM()
    g.drawStop()
    g.drawNotes()

    return container
  }
  // サ�?ネイルオブジェク�?
  function Thumbnail() {
    var lineWidth = 1
    var container = new PIXI.Container()

    // サ�?ネイル�?を作�?
    var g = new PIXI.Graphics()
    g.beginFill(0x0)
    g.lineStyle(lineWidth, 0x404040, 1)
    g.moveTo(0, 0)
    g.lineTo(renderer.width + lineWidth, 0)
    g.lineTo(renderer.width + lineWidth, thumbnailHeight)
    g.lineTo(0, thumbnailHeight)
    g.lineTo(0, 0)
    g.endFill()
    container.addChild(g)

    // サ�?ネイル作�?
    container.widthShrinkRatio = renderer.width / stage.width
    container.heightShrinkRatio = thumbnailHeight / stage.height
    var texture = renderer.generateTexture(stage, {
      scaleMode: PIXI.SCALE_MODES.NEAREST,
      resolution: 2 * container.widthShrinkRatio
    })
    container.thumbnail = new PIXI.Sprite(texture)
    container.thumbnail.width = renderer.width /*- leftMargin - rightMargin*/
    container.thumbnail.height = thumbnailHeight
    // CANVAS では�?��くスプライトが作�?できな�?���?で無表示に
    if (renderer.type != PIXI.RENDERER_TYPE.CANVAS) container.addChild(container.thumbnail)

    // 表示中領域の白�?を作�?
    container.drawViewBox = function () {
      if (container.viewBox == null) {
        container.viewBox = new PIXI.Container()

        // グレーボックス
        var grayMask = new PIXI.Graphics()
        //左
        grayMask.beginFill(0xffffff)
        grayMask.lineStyle(lineWidth, 0x404040, 1)
        grayMask.moveTo(0, 0)
        grayMask.lineTo(-renderer.width, 0)
        grayMask.lineTo(-renderer.width, thumbnailHeight)
        grayMask.lineTo(0, thumbnailHeight)
        grayMask.lineTo(0, 0)
        // 右
        grayMask.moveTo(renderer.width * container.widthShrinkRatio, 0)
        grayMask.lineTo(renderer.width, 0)
        grayMask.lineTo(renderer.width, thumbnailHeight)
        grayMask.lineTo(renderer.width * container.widthShrinkRatio, thumbnailHeight)
        grayMask.lineTo(renderer.width * container.widthShrinkRatio, 0)
        grayMask.endFill()
        // アルファ
        grayMask.alpha = 0.4
        // クリ�?��可能にする
        grayMask.cursor = 'pointer'
        grayMask.eventMode = 'static'
        grayMask.hitArea = new PIXI.Rectangle(-renderer.width, 0, 2 * renderer.width, thumbnailHeight + 50) // +50: はみ出しクリ�?��可能領域
        grayMask.on("mousedown", onClick).on("touchstart", onClick)

        container.viewBox.addChild(grayMask)

        var frame = new PIXI.Graphics()
        frame.lineStyle(lineWidth, 0xffffff, 1)
        //�?の描画
        frame.moveTo(lineWidth, 0)
        frame.lineTo(renderer.width * container.widthShrinkRatio, 0)
        frame.lineTo(renderer.width * container.widthShrinkRatio, thumbnailHeight)
        frame.lineTo(lineWidth, thumbnailHeight)
        frame.lineTo(lineWidth, 0)
        // ドラ�?��可能にする
        frame.cursor = 'pointer'
        frame.eventMode = 'static'
        frame.hitArea = new PIXI.Rectangle(
          lineWidth,
          0,
          renderer.width * container.widthShrinkRatio - lineWidth,
          thumbnailHeight + 50
        ) // +50: はみ出しクリ�?��可能領域
        frame
          .on("mousedown", onDragStart)
          .on("touchstart", onDragStart)
          .on("mouseup", onDragEnd)
          .on("mouseupoutside", onDragEnd)
          .on("touchend", onDragEnd)
          .on("touchendoutside", onDragEnd)
          .on("globalmousemove", onDragMove)
          .on("globaltouchmove", onDragMove)
        container.viewBox.addChild(frame)

        container.addChild(container.viewBox)
      }
      container.viewBox.position.x = (-leftMargin - stage.position.x) * container.widthShrinkRatio
      container.viewBox.position.y = 0
    }
    container.drawViewBox()
    return container
  }

  function render() {
    // show loading spinner
    //HoldOn.open()

    thumbnailHeight = Math.max(window.innerHeight * 0.05, 25)
    //     headerHeight = $("#header").height();
    headerHeight = 50 /* WORKAROUND */

    if (stage == null) {
      // update canvas
      if (renderer != null) {
        renderer.destroy(true) // GPU メモリリーク対�?
      }
      renderer = PIXI.autoDetectRenderer({
        width: window.innerWidth,
        height: window.innerHeight - headerHeight, 
        backgroundColor: schemes[colorScheme].backgroundFill,
        clearBeforeRender: true, // Before: schemes[colorScheme].backgroundFill != 0x000000
        preserveDrawingBuffer: true
      })
      // for performance optimization
      renderer.roundPixels = true
      if (renderer.type == PIXI.RENDERER_TYPE.CANVAS) {
        // CANVAS では透�?オブジェクト�?描画がおかしくなる�?で�?��戻�?
        renderer.clearBeforeRender = true
      }

      document.getElementById("content")!.append(renderer.view)
    } else {
      // window resize
      if (renderer != null) {
        renderer.resize(window.innerWidth, window.innerHeight - headerHeight)
      }
    }

    // コン�?��に追�?
    var initStage = false
    if (stage == null) {
      initStage = true
      stage = new PIXI.Container()
    }
    var posXinit = leftMargin
    var posYinit = renderer.height - thumbnailHeight - bottomMargin
    var posX = posXinit
    var posY = posYinit
    for (var i = 0; i < props.data.score.length; i++) {
      if (i >= measureFrom && i <= measureTo) {
        var measure
        if (measures[i] === undefined || initStage) {
          var expLen = ((props.data.score[i] ? props.data.score[i].length : 72) || props.data.unit) * scaleH
          measure = Measure({
            index: i,
            score: props.data.score[i],
            lnmap: props.data.lnmap,
            scaleW: scaleW,
            scaleH: scaleH,
            length: ((props.data.score[i] ? props.data.score[i].length : 72) || props.data.unit),
            side: playSide,
            keys: props.data.keys == 14 || props.data.keys == 10 || props.data.keys == 9 || props.data.keys == 7 || props.data.keys == 5 ? props.data.keys : 7,
            pattern: pattern,
            unit: props.data.unit,
            exratio: expLen > posYinit ? (posYinit - 2) / expLen : 1,
          })
          measures[i] = measure
        } else {
          measure = measures[i]
        }
        if (posY == posYinit || posY - measure.innerHeight > 0) {
          posY -= measure.innerHeight - 1
        } else {
          posY = posYinit - measure.innerHeight - 1
          posX += measure.innerWidth + posXinit
        }

        //measure.children[0].cacheAsBitmap = null;
        measure.children[0].cacheAsBitmap = false
        measure.position.x = posX
        measure.position.y = posY
        if (initStage) stage.addChild(measure)
        measure.children[0].cacheAsBitmap = true
      }
    }
    if (initStage) {
      stage.eventMode = 'static'
      stage.cursor = 'pointer'
      stage
        .on("mousedown", onDragStart)
        .on("touchstart", onDragStart)
        .on("mouseup", onDragEnd)
        .on("mouseupoutside", onDragEnd)
        .on("touchend", onDragEnd)
        .on("touchendoutside", onDragEnd)
        .on("globalmousemove", onDragMove)
        .on("globaltouchmove", onDragMove)
    }
    stage.hitArea = new PIXI.Rectangle(0, 0, stage.width, stage.height)
    stage.position.x = 0
    stage.position.y = 0

    // サ�?ネイルオブジェクトを作�?
    thumbnail = Thumbnail()

    thumbnail.position.x = 0
    thumbnail.position.y = posYinit + bottomMargin

    // 不要なレンダリングを無効�?
    //for (var i = 0; i < stage.children.length; i++) {
    //    if (-stage.position.x - stage.children[i].width <= stage.children[i].position.x && stage.children[i].position.x <= -stage.position.x + 2 * renderer.width) stage.children[i].visible = true;
    //    else stage.children[i].visible = false;
    //}

    // コン�?��に追�?とレンダリング
    base = new PIXI.Container()
    base.addChild(stage)
    base.addChild(thumbnail)
    renderer.render(base)

    // close loading spinner
    //HoldOn.close()
  }

  var refresh = function () {
    renderer.render(base)
  }

  var updateRender = function () {
    stage = null
    render()
  }

  var dragStartPos = null
  var startPos = null
  var curPosition = null

  function onDragStart(event) {
    // store a reference to the props.data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data
    this.dragging = true
    if (this.parent.parent == thumbnail) {
      curPosition = this.data.getLocalPosition(thumbnail)
    } else {
      curPosition = this.data.getLocalPosition(this.parent)
    }
  }

  function onDragEnd() {
    this.dragging = false

    // set the interaction props.data to null
    this.data = null
    curPosition = null
  }

  function onDragMove() {
    if (this.dragging && curPosition != null) {
      var newPosition
      var deltaX
      if (this.parent.parent == thumbnail) {
        newPosition = this.data.getLocalPosition(thumbnail)
        deltaX = -curPosition.x + newPosition.x
        deltaX /= -thumbnail.widthShrinkRatio
      } else {
        newPosition = this.data.getLocalPosition(this.parent)
        deltaX = -curPosition.x + newPosition.x
      }
      stage.position.x = Math.min(
        Math.max(stage.position.x + deltaX, renderer.width - stage.width - leftMargin - rightMargin),
        0
      )
      thumbnail.drawViewBox()
      requestAnimationFrame(refresh)
      curPosition = newPosition
    }
  }

  function onClick(event) {
    this.data = event.props.data
    if (this.parent.parent == thumbnail) {
      curPosition = this.data.getLocalPosition(thumbnail)
      var posX = curPosition.x - (renderer.width * thumbnail.widthShrinkRatio) / 2
      stage.position.x = Math.min(
        Math.max(-posX / thumbnail.widthShrinkRatio, renderer.width - stage.width - leftMargin - rightMargin),
        0
      )
      thumbnail.drawViewBox()
      requestAnimationFrame(refresh)
    }
  }

  var resizeTimeout = false

  onMount(() => {
    window.addEventListener('resize', () => {
      if (
        renderer == null ||
        (window.innerHeight - headerHeight == renderer.height && window.innerWidth == renderer.width)
      )
        return
      if (resizeTimeout !== false) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(render, 200)
    });
  });

  createEffect(() => {
    if (props.data !== undefined && props.data.score.length !== 0) {
      measureTo = props.data.score.length - 1
      pattern = props.data.pattern
      scaleH = props.params.h
      scaleW = props.params.w
      playSide = props.params.p
      colorScheme = props.params.c
      measureFrom = props.params.f
      measureTo = props.params.t
      updateRender()
    }
  })

    return (
        <div id="content" />
    );
};

export default BmsCanvas;

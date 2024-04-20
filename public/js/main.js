import { Compiler } from 'bms';

  // グローバル変数
  var data = null
  var keys = 7

  // - レンダリングパラメータ
  var urlParam = {}
  var scaleW = 7
  var minScaleW = 4
  var maxScaleW = 10
  var scaleH = 2
  var minScaleH = 0.5
  var maxScaleH = 3.5
  var playSide = 1
  var pattern = null
  var measureFrom = 0
  var measureTo = 0
  var colorScheme = "default"

  // 定数
  var keypatInit = {
    5: "12345",
    7: "1234567",
    9: "123456789",
    10: "12345",
    14: "1234567",
  }

  function getUrlParam() {
    var vars = [],
      hash
    var hashes = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&")
    for (var i = 0; i < hashes.length; i++) {
      hash = hashes[i].split("=")
      vars.push(hash[0])
      vars[hash[0]] = hash[1]
    }
    return vars
  }

  function setUrlParam() {
    if (urlParam == null || Object.keys(urlParam).length == 0) return
    var pathName = location.pathname + "?"
    pathName += $.map(urlParam, function (value, key) {
      return key + "=" + value
    }).join("&")
    history.replaceState("", "", pathName)
    // tweetボタンのリンク先を同期
    $("#tweet_button").attr(
      "href",
      "https://twitter.com/share?url=" + encodeURIComponent(location.href) + "&text=" + encodeURI(data.title)
    )
  }

  function validateKeyPattern(p, k) {
    var isValid = false
    var ret = []
    var str = ""

    if (p == 0) {
      str = String(p)
      for (var i = 0; i < k; i++) {
        ret.push(i)
      }
      isValid = true
    } else if (p == 1) {
      str = String(p)
      for (var i = 1; i <= k; i++) {
        ret.push(k - i)
      }
      isValid = true
    } else {
      var ar = p.split("")
      if (ar.length == k) {
        ar = ar.filter(function (x, i, self) {
          return self.indexOf(x) === i && x >= 1 && x <= k
        })
        if (ar.length == k) {
          ret = []
          str = ""
          for (var i = 0; i < k; i++) {
            ret.push(ar[i] - 1)
            str += ar[i]
          }
          isValid = true
        }
      }
    }
    return [isValid, ret, str]
  }

  function shuffle(arr) {
    var i, j, tmp, length
    for (length = arr.length, i = length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1))
      tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }

  function randomizeKeyPatternStr(str, keys) {
    if (keys == 10 || keys == 14) {
      // DP
      var ar1 = str.split("")
      var ar2 = ar1.splice(keys / 2, keys / 2)
      ar1 = shuffle(ar1)
      ar2 = shuffle(ar2)
      return ar1.join("") + ar2.join("")
    } else {
      // SP
      var ar = shuffle(str.split(""))
      return ar.join("")
    }
  }

  function start(tempParam) {
    // URLパラメータのセ�?��
    // - md5: hash
    if (tempParam.md5 != null) {
      urlParam.md5 = tempParam.md5
    }
    // - w: scale width
    if (tempParam.w != null && tempParam.w >= minScaleW && tempParam.w <= maxScaleW) {
      urlParam.w = scaleW = parseInt(tempParam.w)
    }
    // - h: scale height
    if (tempParam.h != null && tempParam.h >= minScaleH && tempParam.h <= maxScaleH) {
      urlParam.h = scaleH = parseInt(2 * tempParam.h) / 2
    }
    // - p: play side or flip
    if (tempParam.p != null && (tempParam.p == "1" || tempParam.p == "2")) {
      urlParam.p = playSide = parseInt(tempParam.p)
    }
    // - k: key nums (hidden option)
    if (
      tempParam.k != null &&
      (tempParam.k == "5" || tempParam.k == "7" || tempParam.k == "9" || tempParam.k == "10" || tempParam.k == "14")
    ) {
      urlParam.k = keys = parseInt(tempParam.k)
    } else {
      keys = data.keys
    }
    // - c: color scheme
    if (tempParam.c != null && tempParam.c == "mono") {
      urlParam.c = colorScheme = "mono"
    }

    // - o: keys pattern
    // ランダ�?配置初期パターン
    $("#random_pattern_input").val(randomizeKeyPatternStr(keypatInit[keys], keys >= 10 ? keys / 2 : keys))
    $("#random_pattern_input_2p").val(randomizeKeyPatternStr(keypatInit[keys], keys >= 10 ? keys / 2 : keys))
    // 互換性確�?
    if (tempParam.o != null && keys >= 10 && tempParam.o.length == keys) {
      tempParam.o2 = tempParam.o.substr(keys / 2)
      tempParam.o = tempParam.o.substr(0, keys / 2)
    }
    // pattern 初期�?
    const default_pattern = validateKeyPattern(0, keys >= 10 ? keys / 2 : keys)[1]
    pattern = keys >= 10 ? default_pattern.concat(default_pattern) : default_pattern
    if (tempParam.o != null && tempParam.o > 0) {
      var result = validateKeyPattern(tempParam.o, keys >= 10 ? keys / 2 : keys)
      if (result[0]) {
        urlParam.o = result[2]
        pattern = keys >= 10 ? result[1].concat(pattern.slice(keys / 2)) : result[1]
        if (urlParam.o >= 2) {
          $("#random_pattern_input").val(result[2])
        }
      }
    }
    if (keys >= 10 && tempParam.o2 != null && tempParam.o2 > 0) {
      var result = validateKeyPattern(tempParam.o2, keys >= 10 ? keys / 2 : keys)
      if (result[0]) {
        urlParam.o2 = result[2]
        pattern = pattern.slice(0, keys / 2).concat(result[1])
        if (urlParam.o2 >= 2) {
          $("#random_pattern_input_2p").val(result[2])
        }
      }
    }
    // - f
    measureFrom = 0
    if (tempParam.f != null && tempParam.f > 0 && tempParam.f < data.score.length) {
      urlParam.f = measureFrom = parseInt(tempParam.f)
    }
    // - t
    measureTo = data.score.length - 1
    if (tempParam.t != null && tempParam.t >= measureFrom && tempParam.t < data.score.length - 1) {
      urlParam.t = measureTo = parseInt(tempParam.t)
    }
    // - replace url
    setUrlParam()

    // render canvas
    return data;

    $("#save_ss_button").on('click', screenshot);

    // sliders
    // - scaleW
    $("#scaleW-slider").ionRangeSlider({
      type: "single",
      min: minScaleW,
      max: maxScaleW,
      from: scaleW,
      step: 1,
      onFinish: function (data) {
        console.log("onFinish")
        urlParam.w = scaleW = data.from
        updateRender()
        setUrlParam()
      },
    })
    // - scaleH
    $("#scaleH_slider").ionRangeSlider({
      type: "single",
      min: minScaleH,
      max: maxScaleH,
      from: scaleH,
      step: 0.5,
      onFinish: function (data) {
        urlParam.h = scaleH = data.from
        updateRender()
        setUrlParam()
      },
    })
    // - keys
    $(`#keys_${getUrlParam().hasOwnProperty("k") ? getUrlParam().k : data.keys}`)[0].checked = true
    $("#keys_button")
      .find("input")
      .on("change", function (event) {
        urlParam.k = this.value
        setUrlParam()
        location.reload()
      })
    // - play side
    $(playSide == 2 ? "#playside_2p" : "#playside_1p")[0].checked = true
    $("#playside_button")
      .find("input")
      .on("change", function (event) {
        urlParam.p = playSide = parseInt(this.value)
        updateRender()
        setUrlParam()
      })
    if (keys == 10 || keys == 14) {
      // DP 用にオプション表記を変更
      $("#playside_text").text("flip: ")
      $("#playside_text_1p").text("OFF")
      $("#playside_text_2p").text("ON")
    } else if (keys == 9) {
      // PMS にサイド�?な�?
      $("#playside_option").css("display", "none")
    }
    // - option 1P
    if (keys >= 10) {
      $("#option_text").text("option 1P:")
    } else {
      $("#menu_box_option_2p").css("display", "none")
    }
    $("#random_pattern_input").attr("maxlength", keys >= 10 ? keys / 2 : keys) // �?��数制�?=KEY数
    if (!urlParam.o || urlParam.o == 0) {
      $("#option_off")[0].checked = true
    } else if (urlParam.o == 1) {
      $("#option_mirror")[0].checked = true
    } else {
      $("#option_random")[0].checked = true
    }
    $("#option_button")
      .find("input")
      .on("change", function (event) {
        switch (this.value) {
          case "0":
            $("#option_off")[0].checked = true
            delete urlParam.o
            pattern = keys >= 10 ? default_pattern.concat(pattern.slice(keys / 2)) : null
            updateRender()
            setUrlParam()
            break
          case "1":
            $("#option_mirror")[0].checked = true
            urlParam.o = 1
            pattern =
              keys >= 10
                ? validateKeyPattern(1, keys / 2)[1].concat(pattern.slice(keys / 2))
                : validateKeyPattern(1, keys)[1]
            updateRender()
            setUrlParam()
            break
          case "2":
            $("#option_random")[0].checked = true
            var result = validateKeyPattern($("#random_pattern_input").val(), keys >= 10 ? keys / 2 : keys)
            if (result[0]) {
              pattern = keys >= 10 ? result[1].concat(pattern.slice(keys / 2)) : result[1]
              urlParam.o = result[2]
              updateRender()
              setUrlParam()
            } else {
              $("#option_off").trigger("change")
            }
            break
          default:
            break
        }
      })
    $("#random_pattern_auto_button").on("click", function (event) {
      $("#random_pattern_input").val(randomizeKeyPatternStr(keypatInit[keys], keys >= 10 ? keys / 2 : keys))
      $("#option_random").trigger("change")
    })
    $("#random_pattern_input").on("change", function (event) {
      $("#option_random").trigger("change")
    })
    // - option 2P
    $("#random_pattern_input_2p").attr("maxlength", keys >= 10 ? keys / 2 : keys) // �?��数制�?=KEY数
    if (!urlParam.o2 || urlParam.o2 == 0) {
      $("#option_off_2p")[0].checked = true
    } else if (urlParam.o == 1) {
      $("#option_mirror_2p")[0].checked = true
    } else {
      $("#option_random_2p")[0].checked = true
    }
    $("#option_button_2p")
      .find("input")
      .on("change", function (event) {
        if (keys < 10) return
        switch (this.value) {
          case "0":
            $("#option_off_2p")[0].checked = true
            delete urlParam.o2
            pattern = pattern.slice(0, keys / 2).concat(default_pattern)
            updateRender()
            setUrlParam()
            break
          case "1":
            $("#option_mirror_2p")[0].checked = true
            urlParam.o2 = 1
            pattern = pattern.slice(0, keys / 2).concat(validateKeyPattern(1, keys / 2)[1])
            updateRender()
            setUrlParam()
            break
          case "2":
            $("#option_random_2p")[0].checked = true
            var result = validateKeyPattern($("#random_pattern_input_2p").val(), keys >= 10 ? keys / 2 : keys)
            if (result[0]) {
              pattern = pattern.slice(0, keys / 2).concat(result[1])
              urlParam.o2 = result[2]
              updateRender()
              setUrlParam()
            } else {
              $("#option_off_2p").trigger("change")
            }
            break
          default:
            break
        }
      })
    $("#random_pattern_auto_button_2p").on("click", function (event) {
      $("#random_pattern_input_2p").val(randomizeKeyPatternStr(keypatInit[keys], keys >= 10 ? keys / 2 : keys))
      $("#option_random_2p").trigger("change")
    })
    $("#random_pattern_input_2p").on("change", function (event) {
      $("#option_random_2p").trigger("change")
    })

    // - clip
    $("#clip_slider").ionRangeSlider({
      type: "double",
      min: 0,
      max: Math.max(data.score.length - 1, 0),
      from: measureFrom,
      to: measureTo,
      step: 1,
      onFinish: function (data) {
        urlParam.f = measureFrom = data.from
        urlParam.t = measureTo = data.to
        updateRender()
        setUrlParam()
      },
    })

    // - color scheme
    $(colorScheme == "mono" ? "#color_mono" : "#color_default")[0].checked = true
    $("#color_button")
      .find("input")
      .on("change", function (event) {
        colorScheme = this.value
        if (this.value != "default") {
          urlParam.c = colorScheme
        } else {
          delete urlParam.c
        }
        updateRender()
        setUrlParam()
      })
  }

const getJudgeRank = (r) => {
  switch (r) {
    case "0":
      return "VERY HARD";
    case "1":
      return "HARD";
    case "2":
      return "NORMAL";
    case "3":
      return "EASY";
    case "4":
      return "VERY EASY";
    default:
      return "???";
  }
};

export default function openBMS (bmsSource, keys) {
  const tempParam = getUrlParam()

  const compileResult = Compiler.compile(bmsSource)
  const chart = compileResult.chart

  const headers = chart.headers._data
  let lntype = headers.lntype
  const lnobj = headers.lnobj
  if (lnobj === undefined && lntype === undefined)
    lntype = "1"

  const objects = chart.objects.allSorted()

  const timeSignatures = chart.timeSignatures._values
  let ribbitResponse = {
    artist: (headers.artist || "") + (headers.subartist && headers.artist ? " " : "") + (headers.subartist || ""),
    bpm: headers.bpm,
    genre: headers.genre,
    keys: keys || 7,
    lnmap: {},
    notes: objects.filter(x => x.channel.match(/[12][1-9]/) && x.value !== lnobj).length + objects.filter(x => lntype === "1" && x.channel.match(/[56][1-9]/)).length / 2,
    score: [...Array(objects.slice(-1)[0].measure + 1).keys()].map(() => {
      return { length: 72 }
    }),
    title: (headers.title || "") + (headers.title && headers.subtitle ? " " : "") + (headers.subtitle || ""),
    total: headers.total ? headers.total : "undefined",
    rank: getJudgeRank(headers.rank),
    unit: 72,
  }

  for (const [measure, timeSignature] of Object.entries(timeSignatures)) {
    ribbitResponse.score[measure] = { length: timeSignature * 72 }
  }

  let previousObjects = [...Array(36 ** 2).keys()].reduce(
    (obj, i) => Object.assign(obj, { [i.toString(36)]: undefined }),
    {}
  )

  for (const object of objects) {
    let channel = object.channel.charAt(0) === "5" ? `1${object.channel.charAt(1)}` : object.channel
    channel = object.channel.charAt(0) === "6" ? `2${object.channel.charAt(1)}` : channel
    if (!ribbitResponse.score[object.measure].hasOwnProperty(channel)) {
      ribbitResponse.score[object.measure][channel] = []
    }

    if (
      lntype == "1" &&
      (object.channel.charAt(0) === "5" || object.channel.charAt(0) === "6") &&
      previousObjects[object.channel] !== undefined
    ) {
      if (!ribbitResponse.lnmap.hasOwnProperty(channel)) {
        ribbitResponse.lnmap[channel] = []
      }
      ribbitResponse.lnmap[channel].push([
        previousObjects[object.channel],
        [object.measure, object.fraction * ribbitResponse.score[object.measure].length],
      ])
      previousObjects[object.channel] = undefined
    } else if (lnobj !== undefined && object.value === lnobj) {
      if (!ribbitResponse.lnmap.hasOwnProperty(object.channel)) {
        ribbitResponse.lnmap[object.channel] = []
      }
      ribbitResponse.lnmap[object.channel].push([
        previousObjects[object.channel],
        [object.measure, object.fraction * ribbitResponse.score[object.measure].length],
      ])
    } else if (object.channel === "08") {
      ribbitResponse.score[object.measure][object.channel].push([
        object.fraction * ribbitResponse.score[object.measure].length,
        headers[`bpm${object.value.toLowerCase()}`],
        object.value,
      ])
    } else {
      ribbitResponse.score[object.measure][channel].push([
        object.fraction * ribbitResponse.score[object.measure].length,
        parseInt(object.value, 16),
      ])
      previousObjects[object.channel] = [object.measure, object.fraction * ribbitResponse.score[object.measure].length]
    }
  }

  if (ribbitResponse != null && Object.keys(ribbitResponse).length != 0) {
    data = ribbitResponse
    var res = true
    if (data.notes > 100000) {
      res = confirm(
        "10万ノーツ以上の譜面を開こうとしています\n続行するとブラウザがクラッシュする可能性があります"
      )
    }
    if (res) {
      return start(tempParam)
    }
  } else {
    HoldOn.close()
    location.reload()
  }
}

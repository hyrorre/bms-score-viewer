import { Compiler } from "bms";

// - レンダリングパラメータ
const minScaleW = 4;
const maxScaleW = 10;
const minScaleH = 0.5;
const maxScaleH = 3.5;

export function validateKeyPattern(p, k) {
  var isValid = false;
  var ret = [];
  var str = "";

  if (p == 0) {
    str = String(p);
    for (var i = 0; i < k; i++) {
      ret.push(i);
    }
    isValid = true;
  } else if (p == 1) {
    str = String(p);
    for (var i = 1; i <= k; i++) {
      ret.push(k - i);
    }
    isValid = true;
  } else {
    var ar = p.split("");
    if (ar.length == k) {
      ar = ar.filter(function (x, i, self) {
        return self.indexOf(x) === i && x >= 1 && x <= k;
      });
      if (ar.length == k) {
        ret = [];
        str = "";
        for (var i = 0; i < k; i++) {
          ret.push(ar[i] - 1);
          str += ar[i];
        }
        isValid = true;
      }
    }
  }
  return [isValid, ret, str];
}

function start(tempParam, data) {
  var keys = 7;
  var urlParam = {};
  var pattern = null;
  // URLパラメータのセ�?��
  // - w: scale width
  if (
    tempParam.w != null &&
    tempParam.w >= minScaleW &&
    tempParam.w <= maxScaleW
  ) {
    urlParam.w = parseInt(tempParam.w);
  }
  // - h: scale height
  if (
    tempParam.h != null &&
    tempParam.h >= minScaleH &&
    tempParam.h <= maxScaleH
  ) {
    urlParam.h = parseInt(2 * tempParam.h) / 2;
  }
  // - p: play side or flip
  if (tempParam.p != null && (tempParam.p == "1" || tempParam.p == "2")) {
    urlParam.p = parseInt(tempParam.p);
  }
  // - k: key nums (hidden option)
  if (
    tempParam.k != null &&
    (tempParam.k == "5" ||
      tempParam.k == "7" ||
      tempParam.k == "9" ||
      tempParam.k == "10" ||
      tempParam.k == "14")
  ) {
    urlParam.k = data.keys = keys = parseInt(tempParam.k);
  } else {
    keys = data.keys;
  }
  // - c: color scheme
  if (tempParam.c != null && tempParam.c == "mono") {
    urlParam.c = "mono";
  }

  // - o: keys pattern
  // 互換性確�?
  if (tempParam.o != null && keys >= 10 && tempParam.o.length == keys) {
    tempParam.o2 = tempParam.o.substr(keys / 2);
    tempParam.o = tempParam.o.substr(0, keys / 2);
  }
  // pattern 初期�?
  let randP1 = "";
  const default_pattern = validateKeyPattern(
    0,
    keys >= 10 ? keys / 2 : keys
  )[1];
  pattern =
    keys >= 10 ? default_pattern.concat(default_pattern) : default_pattern;
  if (tempParam.o != null && tempParam.o > 0) {
    var result = validateKeyPattern(tempParam.o, keys >= 10 ? keys / 2 : keys);
    if (result[0]) {
      urlParam.o = result[2];

      pattern =
        keys >= 10 ? result[1].concat(pattern.slice(keys / 2)) : result[1];
      if (urlParam.o >= 2) {
        randP1 = result[2];
      }
    }
  }
  let randP2 = "";
  if (keys >= 10 && tempParam.o2 != null && tempParam.o2 > 0) {
    var result = validateKeyPattern(tempParam.o2, keys >= 10 ? keys / 2 : keys);
    if (result[0]) {
      urlParam.o2 = result[2];
      pattern = pattern.slice(0, keys / 2).concat(result[1]);
      if (urlParam.o2 >= 2) {
        randP2 = result[2];
      }
    }
  }
  // - f
  let measureFrom = 0;
  if (
    tempParam.f != null &&
    tempParam.f > 0 &&
    tempParam.f < data.score.length
  ) {
    urlParam.f = parseInt(tempParam.f);
  }
  // - t
  if (
    tempParam.t != null &&
    tempParam.t >= measureFrom &&
    tempParam.t < data.score.length - 1
  ) {
    urlParam.t = parseInt(tempParam.t);
  } else {
    urlParam.t = data.score.length - 1;
  }

  data.pattern = pattern;
  return [data, urlParam, randP1, randP2];
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

export function openBMS(bmsSource, keys, tempParam) {
  const compileResult = Compiler.compile(bmsSource);
  const chart = compileResult.chart;

  const headers = chart.headers._data;
  let lntype = headers.lntype;
  const lnobj = headers.lnobj;
  if (lnobj === undefined && lntype === undefined) lntype = "1";

  const objects = chart.objects.allSorted();

  const timeSignatures = chart.timeSignatures._values;
  let ribbitResponse = {
    artist:
      (headers.artist || "") +
      (headers.subartist && headers.artist ? " " : "") +
      (headers.subartist || ""),
    bpm: headers.bpm,
    genre: headers.genre,
    keys: keys || 7,
    lnmap: {},
    notes:
      objects.filter((x) => x.channel.match(/[12][1-9]/) && x.value !== lnobj)
        .length +
      objects.filter((x) => lntype === "1" && x.channel.match(/[56][1-9]/))
        .length /
        2,
    score: [...Array(objects.slice(-1)[0].measure + 1).keys()].map(() => {
      return { length: 72 };
    }),
    title:
      (headers.title || "") +
      (headers.title && headers.subtitle ? " " : "") +
      (headers.subtitle || ""),
    total: headers.total ? headers.total : "undefined",
    rank: getJudgeRank(headers.rank),
    unit: 72,
  };

  for (const [measure, timeSignature] of Object.entries(timeSignatures)) {
    ribbitResponse.score[measure] = { length: timeSignature * 72 };
  }

  let previousObjects = [...Array(36 ** 2).keys()].reduce(
    (obj, i) => Object.assign(obj, { [i.toString(36)]: undefined }),
    {}
  );

  for (const object of objects) {
    let channel =
      object.channel.charAt(0) === "5"
        ? `1${object.channel.charAt(1)}`
        : object.channel;
    channel =
      object.channel.charAt(0) === "6"
        ? `2${object.channel.charAt(1)}`
        : channel;
    if (!ribbitResponse.score[object.measure].hasOwnProperty(channel)) {
      ribbitResponse.score[object.measure][channel] = [];
    }

    if (
      lntype == "1" &&
      (object.channel.charAt(0) === "5" || object.channel.charAt(0) === "6") &&
      previousObjects[object.channel] !== undefined
    ) {
      if (!ribbitResponse.lnmap.hasOwnProperty(channel)) {
        ribbitResponse.lnmap[channel] = [];
      }
      ribbitResponse.lnmap[channel].push([
        previousObjects[object.channel],
        [
          object.measure,
          object.fraction * ribbitResponse.score[object.measure].length,
        ],
      ]);
      previousObjects[object.channel] = undefined;
    } else if (lnobj !== undefined && object.value === lnobj) {
      if (!ribbitResponse.lnmap.hasOwnProperty(object.channel)) {
        ribbitResponse.lnmap[object.channel] = [];
      }
      ribbitResponse.lnmap[object.channel].push([
        previousObjects[object.channel],
        [
          object.measure,
          object.fraction * ribbitResponse.score[object.measure].length,
        ],
      ]);
    } else if (object.channel === "08") {
      ribbitResponse.score[object.measure][object.channel].push([
        object.fraction * ribbitResponse.score[object.measure].length,
        headers[`bpm${object.value.toLowerCase()}`],
        object.value,
      ]);
    } else {
      ribbitResponse.score[object.measure][channel].push([
        object.fraction * ribbitResponse.score[object.measure].length,
        parseInt(object.value, 16),
      ]);
      previousObjects[object.channel] = [
        object.measure,
        object.fraction * ribbitResponse.score[object.measure].length,
      ];
    }
  }

  if (ribbitResponse != null && Object.keys(ribbitResponse).length != 0) {
    let data = ribbitResponse;
    var res = true;
    if (data.notes > 100000) {
      res = confirm(
        "10万ノーツ以上の譜面を開こうとしています\n続行するとブラウザがクラッシュする可能性があります"
      );
    }
    if (res) {
      return start(tempParam, data);
    }
  } else {
    location.reload();
  }
}

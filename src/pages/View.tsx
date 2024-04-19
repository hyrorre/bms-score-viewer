import { For, onMount, type Component } from 'solid-js';
import { Meta, MetaProvider, Title, Link } from '@solidjs/meta';
import { Compiler } from 'bms';
import Encoding from 'encoding-japanese';
import '../../public/js/jquery-3.7.1.min.js';
import '../../public/plugin/holdon/HoldOn.min.js';
import '../../public/js/main.js';
//import openBMS from '../../public/js/main.js';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet.jsx';
import { Slider, SliderFill, SliderLabel, SliderThumb, SliderTrack, SliderValueLabel } from "~/components/ui/slider";
import { RadioGroup, RadioGroupItem, RadioGroupItemLabel } from "~/components/ui/radio-group";
import { Label } from '~/components/ui/label.jsx';
import { Col, Grid } from '~/components/ui/grid.jsx';
import { buttonVariants } from '~/components/ui/button.jsx';
import { A, useSearchParams } from '@solidjs/router';
import { Input } from '~/components/ui/input.jsx';

const View: Component = () => {
  const [queryParams, setQueryParams] = useSearchParams();

  const getJudgeRank = (r: string | undefined) => {
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

  const openBMS = (bmsSource: string, keys: number) => {
    const compileResult = Compiler.compile(bmsSource)
    const chart = compileResult.chart
  
    const headers = chart.headers
    let lntype = headers.get("lntype")
    const lnobj = headers.get("lnobj")
    if (lnobj === undefined && lntype === undefined)
      lntype = "1"
  
    const objects = chart.objects.allSorted()
  
    const timeSignatures = chart.timeSignatures.getAll();
    let ribbitResponse = {
      artist: (headers.get("artist") || "") + (headers.get("subartist") && headers.get("artist") ? " " : "") + (headers.get("subartist") || ""),
      bpm: headers.get("bpm"),
      genre: headers.get("genre"),
      keys: keys || 7,
      lnmap: {},
      notes: objects.filter(x => x.channel.match(/[12][1-9]/) && x.value !== lnobj).length + objects.filter(x => lntype === "1" && x.channel.match(/[56][1-9]/)).length / 2,
      score: [...Array(objects.slice(-1)[0].measure + 1).keys()].map(() => {
        return { length: 72 }
      }),
      title: (headers.get("title") || "") + (headers.get("title") && headers.get("subtitle") ? " " : "") + (headers.get("subtitle") || ""),
      total: headers.get("total") ? headers.get("total") : "undefined",
      rank: getJudgeRank(headers.get("rank")),
      unit: 72,
    }
  
    for (const [measure, timeSignature] of Object.entries(timeSignatures)) {
      console.log(measure)
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
        start(queryParams)
        return
      }
    } else {
      HoldOn.close()
      location.reload()
    }
  }

  onMount(async () => {
    // Loading spinner
    let response: Response;
    try {
      response = await fetch(`${import.meta.env.VITE_API_URL}/bms/score/get?md5=${queryParams.md5}`)
    } catch (e) {
      alert("BMSファイルが開けませんでした");
      return;
    }
    var dataJson = await response.json();
    const decodedArray = atob(dataJson["data"]);
    let bms = Encoding.convert(decodedArray, {
      to: 'UNICODE',
      from: 'SJIS',
      type: 'string'
    });
    openBMS(bms, dataJson["keys"])
  });

  return (
    <MetaProvider>
      <Meta charset="utf-8" />
      <Meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <Meta name="viewport" content="width=device-width,user-scalable=no" />
      <Meta name="robots" content="noindex" />
      <Title>BMS Score Viewer -</Title>
      <Link href={"../plugin/font-awesome/css/font-awesome.css"} rel="stylesheet" />
      <Link href={"../plugin/holdon/HoldOn.min.css"} rel="stylesheet" />
      <Link href={"../css/main.css"} rel="stylesheet" />
      <div id="content">
        <div id="header">
          <div id="header_info">
            <span class="title_texts"><span id="title" /> / <span id="artist" /> </span>
            <span id="title_misc">
              - bpm: <span id="bpm" /> / Notes: <span id="totalnotes" /> / Total: <span id="total" /> / Rank: <span id="rank" />
            </span>
          </div>
          <div id="header_bars">
            <span />
            <Sheet id="menu">
              <SheetTrigger><p><i class="fa fa-cog fa-lg" /></p></SheetTrigger>
              <SheetContent class="w-[300px] overflow-auto">
                <SheetHeader>
                  <SheetTitle>Options</SheetTitle>
                  <SheetDescription>
                    <div id="menu_header">
                      <Grid cols={5} colsMd={5} class="w-full gap-1">
                        <Col span={2} spanMd={2}>
                          <A id="link_to_lr2ir" href="" class={buttonVariants({ variant: "default" })}>LR2IR</A>
                        </Col>
                        <Col>
                          <A id="link_to_home" href="/" class={buttonVariants({ variant: "secondary" })}><i class="fa fa-home" /></A>
                        </Col>
                        <Col>
                          <A id="tweet_button" href="https://twitter.com/share?" target="_blank" class={buttonVariants({ variant: "secondary" })}><i class="fa fa-twitter" /></A>
                        </Col>
                        <Col>
                          <A id="save_ss_button" href="#" class={buttonVariants({ variant: "secondary" })}><i class="fa fa-camera" /></A>
                        </Col>
                      </Grid>
                    </div>
                  </SheetDescription>
                </SheetHeader>
                <div>
                  <div class="menu_box pt-3">
                    <Slider
                      minValue={4}
                      maxValue={10}
                      defaultValue={[7]}
                      class="py-3"
                    >
                      <div class="flex w-full justify-between pb-3">
                        <SliderLabel>Width</SliderLabel>
                        <SliderValueLabel />
                      </div>
                      <SliderTrack>
                        <SliderFill />
                        <SliderThumb />
                      </SliderTrack>
                    </Slider>
                  </div>
                  <div class="menu_box">
                    <Slider
                      minValue={0.5}
                      maxValue={3.5}
                      defaultValue={[2]}
                      step={0.5}
                      class="py-3"
                    >
                      <div class="flex w-full justify-between pb-3">
                        <SliderLabel>Height</SliderLabel>
                        <SliderValueLabel />
                      </div>
                      <SliderTrack>
                        <SliderFill />
                        <SliderThumb />
                      </SliderTrack>
                    </Slider>
                  </div>
                  <div class="space-y-3 pt-3">
                    <Label for="keys_button">Keys</Label>
                    <RadioGroup id="keys_button" value={"7"}>
                      <Grid cols={4} colsMd={5} class="w-full gap-2">
                        <For each={["5", "7", "9", "10", "14"]}>
                          {(key) => (
                            <Col>
                              <RadioGroupItem value={key}>
                                <RadioGroupItemLabel>{key}</RadioGroupItemLabel>
                              </RadioGroupItem>
                            </Col>
                          )}
                        </For>
                      </Grid>
                    </RadioGroup>
                  </div>
                  <div class="space-y-3 pt-3">
                    <Label for="playside_button">Side</Label>
                    <RadioGroup id="playside_button">
                      <Grid cols={2} class="w-full gap-2">
                        <For each={["P1", "P2"]}>
                          {(side) => (
                            <Col>
                              <RadioGroupItem value={side}>
                                <RadioGroupItemLabel>{side}</RadioGroupItemLabel>
                              </RadioGroupItem>
                            </Col>
                          )}
                        </For>
                      </Grid>
                    </RadioGroup>
                  </div>
                  <div class="space-y-3 pt-3">
                    <Label for="option_button">Option</Label>
                    <RadioGroup id="option_button">
                      <For each={["OFF", "MIRROR", "RANDOM"]}>
                        {(opt) => (
                          <Col>
                            <RadioGroupItem value={opt}>
                              <RadioGroupItemLabel>{opt}</RadioGroupItemLabel>
                            </RadioGroupItem>
                          </Col>
                        )}
                      </For>
                    </RadioGroup>
                    <div id="random_pattern">
                      <Input type="text" id="random_pattern_input" value="1234567" class="w-30 inline" />
                      <button type="submit" id="random_pattern_auto_button" class="inline px-2"><i class="fa fa-refresh fa-lg" /></button>
                    </div>
                  </div>
                  <div class="space-y-3 pt-3">
                    <Label for="option_button_2p">Option 2P</Label>
                    <RadioGroup id="option_button_2p">
                      <For each={["OFF", "MIRROR", "RANDOM"]}>
                        {(opt) => (
                          <Col>
                            <RadioGroupItem value={opt}>
                              <RadioGroupItemLabel>{opt}</RadioGroupItemLabel>
                            </RadioGroupItem>
                          </Col>
                        )}
                      </For>
                    </RadioGroup>
                    <div id="random_pattern">
                      <Input type="text" id="random_pattern_input" value="1234567" class="w-30 inline" />
                      <button type="submit" id="random_pattern_auto_button" class="inline px-2"><i class="fa fa-refresh fa-lg" /></button>
                    </div>
                  </div>
                  <div class="menu_box pt-3">
                    <Slider
                      minValue={1}
                      maxValue={100}
                      defaultValue={[1, 100]}
                      class="py-3"
                    >
                      <div class="flex w-full justify-between pb-3">
                        <SliderLabel>Clip</SliderLabel>
                        <SliderValueLabel />
                      </div>
                      <SliderTrack>
                        <SliderFill />
                        <SliderThumb />
                        <SliderThumb />
                      </SliderTrack>
                    </Slider>
                  </div>
                  <div class="space-y-3 pt-3">
                    <Label for="color_button">Color</Label>
                    <RadioGroup id="color_button">
                      <Grid cols={2} class="w-full gap-2">
                        <For each={["Default", "Mono"]}>
                          {(color) => (
                            <Col>
                              <RadioGroupItem value={color}>
                                <RadioGroupItemLabel>{color}</RadioGroupItemLabel>
                              </RadioGroupItem>
                            </Col>
                          )}
                        </For>
                      </Grid>
                    </RadioGroup>
                  </div>
                  <div class="menu_box pt-3">
                    <div class="menu_box_header">
                      <Label for="terms1-input">Note</Label>
                    </div>
                    <div class="text-sm text-muted-foreground">
                      <p>
                        このアプリケーションは<a href="https://github.com/rib2bit">@rib2bit</a>様の<a href="http://ribbit.xyz/bms/score/">BMS Score Viewer</a>の非公認ミラーサイトです。本家のサービスが復旧するまでの間のみ一時的に公開します。
                      </p>
                      <p>静的サイトとしての公開に伴うソースコードの改変部分について一切の著作者人格権を行使しません。</p><br />
                      <p>
                        GitHub: <a href="https://github.com/SayakaIsBaka/bms-score-viewer">SayakaIsBaka/bms-score-viewer</a>
                      </p>
                      <p>
                        Original mirror by <a href="https://github.com/ladymade-star/bms-score-viewer">ladymade-star</a>
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </MetaProvider>
  );
}

export default View;
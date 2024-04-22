import { For, Show, createSignal, onMount, type Component } from 'solid-js';
import { Meta, MetaProvider, Link } from '@solidjs/meta';
import { saveAs } from 'file-saver';
import Encoding from 'encoding-japanese';
import { openBMS, validateKeyPattern } from '../lib/bms.js';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet.jsx';
import { Slider, SliderFill, SliderLabel, SliderThumb, SliderTrack, SliderValueLabel } from "~/components/ui/slider";
import { RadioGroup, RadioGroupItem, RadioGroupItemLabel } from "~/components/ui/radio-group";
import { Label } from '~/components/ui/label.jsx';
import { Col, Grid } from '~/components/ui/grid.jsx';
import { buttonVariants } from '~/components/ui/button.jsx';
import { A, useNavigate, useSearchParams } from '@solidjs/router';
import { Input } from '~/components/ui/input.jsx';
import BmsCanvas from '~/components/BmsCanvas.jsx';
import LoadingOverlay from '~/components/LoadingOverlay.jsx';

import styles from './View.module.css';
import GitHubLogo from '../assets/github-mark.svg'
import { FaBrandsTwitter, FaSolidArrowRotateRight, FaSolidCamera, FaSolidGear, FaSolidHouseChimney } from "solid-icons/fa";

const keypatInit: any = {
  5: "12345",
  7: "1234567",
  9: "123456789",
  10: "12345",
  14: "1234567",
};

const View: Component = () => {
  const shuffle = (arr: any[]) => {
    let i, j, tmp, length;
    for (length = arr.length, i = length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  };

  const randomizeKeyPatternStr = (str: string, keys: number) => {
    if (keys == 10 || keys == 14) {
      // DP
      let ar1 = str.split("");
      let ar2 = ar1.splice(keys / 2, keys / 2);
      ar1 = shuffle(ar1);
      ar2 = shuffle(ar2);
      return ar1.join("") + ar2.join("");
    } else {
      // SP
      let ar = shuffle(str.split(""));
      return ar.join("");
    }
  };

  const [queryParams, setQueryParams] = useSearchParams();
  const [data, setData] = createSignal({
    title: "",
    artist: "",
    bpm: 0,
    notes: 0,
    total: 0,
    keys: 0,
    rank: "",
    score: [],
    pattern: [] as number[]
  });
  const [viewParams, setViewParams] = createSignal({
    w: 7, //scaleW
    h: 2, //scaleH
    p: 1, //Playside / flip
    c: 'default', //colorscheme
    o: 0, //random pattern 1
    o2: 0, //random pattern 2
    f: 0, //from
    t: 0, //to
  });
  const [randomP1, setRandomP1] = createSignal("");
  const [randomP2, setRandomP2] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [keys, setKeys] = createSignal(0);
  const navigate = useNavigate();

  let bmsData = "";

  const updatePattern = (e: string, keyChange: boolean = false) => { // pattern is null for keys < 10 if nonran for optimization purposes
    const default_pattern = validateKeyPattern(0, keys() >= 10 ? keys() / 2 : keys())[1];
    switch (e) {
      case "0":
        setData({ ...data(), pattern: keys() >= 10 ? default_pattern.concat(data().pattern.slice(keys() / 2)) : (keyChange ? default_pattern : null!) });
        break;
      case "1":
        setData({
          ...data(), pattern:
            keys() >= 10
              ? validateKeyPattern(1, keys() / 2)[1].concat(data().pattern.slice(keys() / 2))
              : validateKeyPattern(1, keys())[1]
        });
        break;
      case "2":
        var result = validateKeyPattern(randomP1(), keys() >= 10 ? keys() / 2 : keys());
        if (result[0]) {
          setData({ ...data(), pattern: keys() >= 10 ? result[1].concat(data().pattern.slice(keys() / 2)) : result[1] });
        } else {
          setViewParams({ ...viewParams(), o: 0 });
          updatePattern("0");
          return;
        }
    }
    setQueryParams({o: (e === "0" ? "" : (e === "1" ? e : randomP1()))});
  };

  const updatePatternP2 = (e: string) => {
    if (keys() < 10) return;
    const default_pattern = validateKeyPattern(0, keys() >= 10 ? keys() / 2 : keys())[1];
    switch (e) {
      case "0":
        setData({ ...data(), pattern: data().pattern.slice(0, keys() / 2).concat(default_pattern) });
        break;
      case "1":
        setData({ ...data(), pattern: data().pattern.slice(0, keys() / 2).concat(validateKeyPattern(1, keys() / 2)[1]) });
        break;
      case "2":
        var result = validateKeyPattern(randomP2(), keys() >= 10 ? keys() / 2 : keys())
        if (result[0]) {
          setData({ ...data(), pattern: data().pattern.slice(0, keys() / 2).concat(result[1]) });
        } else {
          setViewParams({ ...viewParams(), o2: 0 });
          updatePatternP2("0");
          return;
        }
    }
    setQueryParams({o2: (e === "0" ? "" : (e === "1" ? e : randomP2()))});
  };

  const screenshot = () => {
    const canvas = document.getElementById("content")?.children[0] as HTMLCanvasElement;
    canvas.toBlob((blob) => {
      saveAs(blob!, "score.png");
    })
  }

  const load = () => {
    let [data, params, randP1, randP2] = openBMS(bmsData, keys(), queryParams);
    if (data === null) {
      navigate("/");
      return;
    }

    if (randP1)
      setRandomP1(randP1);
    if (randP2)
      setRandomP2(randP2);
    setData(data);
    setKeys(data.keys);

    setViewParams({ ...viewParams(), ...params });
    document.title = document.title + ' - ' + data.title;
  }

  onMount(async () => {
    setLoading(true);
    let response: Response;
    response = await fetch(`${import.meta.env.VITE_API_URL}/bms/score/get?md5=${queryParams.md5}`);
    if (!response.ok) {
      alert("BMSファイルが開けませんでした");
      return;
    }
    var dataJson = await response.json();
    const decodedArray = atob(dataJson["data"]);
    bmsData = Encoding.convert(decodedArray, {
      to: 'UNICODE',
      from: 'SJIS',
      type: 'string'
    });

    setKeys(dataJson["keys"]);
    setRandomP1(randomizeKeyPatternStr(keypatInit[keys()], keys() >= 10 ? keys() / 2 : keys()));
    setRandomP2(randomizeKeyPatternStr(keypatInit[keys()], keys() >= 10 ? keys() / 2 : keys()));

    load()
    setLoading(false);
    document.getElementById(styles.header)!.style.visibility = "visible";
  });

  return (
    <MetaProvider>
      <Meta name="viewport" content="width=device-width,user-scalable=no" />
      <Meta name="robots" content="noindex" />
      <Show when={loading()}>
        <LoadingOverlay />
      </Show>
      <div class={styles.body}>
        <div id={styles.header}>
          <div id={styles.header_info}>
            <span class={styles.title_texts}><span id={styles.title}>{data().title}</span> / {data().artist} </span>
            <span id={styles.title_misc}>
              - bpm: {data().bpm} / Notes: {data().notes} / Total: {data().total} / Rank: {data().rank}
            </span>
          </div>
          <div id={styles.header_bars}>
            <span />
            <Sheet id="menu">
              <SheetTrigger class="pr-1"><p><FaSolidGear size={"1.2em"} class="hover:animate-[spin_3s_linear_infinite]" /></p></SheetTrigger>
              <SheetContent class="w-[300px] overflow-auto">
                <SheetHeader>
                  <SheetTitle>Options</SheetTitle>
                  <SheetDescription>
                    <div id="menu_header">
                      <Grid cols={5} colsMd={5} class="w-full gap-1">
                        <Col span={2} spanMd={2}>
                          <A id="link_to_lr2ir" href={"http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5=" + queryParams.md5} target="_blank" class={buttonVariants({ variant: "default" })}>LR2IR</A>
                        </Col>
                        <Col>
                          <A id="link_to_home" href="/" class={buttonVariants({ variant: "secondary" })}><FaSolidHouseChimney class={styles["fa-home"]} /></A>
                        </Col>
                        <Col>
                          <A id="tweet_button" href={"https://twitter.com/share?url=" + encodeURIComponent(location.href) + "&text=" + encodeURI(data().title)} target="_blank" class={buttonVariants({ variant: "secondary" })}><FaBrandsTwitter class={styles["fa-twitter"]} /></A>
                        </Col>
                        <Col>
                          <A id="save_ss_button" onClick={screenshot} href={location.href} class={buttonVariants({ variant: "secondary" })}><FaSolidCamera class={styles["fa-camera"]} /></A>
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
                      defaultValue={[viewParams().w]}
                      onChangeEnd={(e) => {
                        setViewParams({ ...viewParams(), w: e[0] })
                        setQueryParams({w: e[0]})
                      }}
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
                      defaultValue={[viewParams().h]}
                      onChangeEnd={(e) => {
                        setViewParams({ ...viewParams(), h: e[0] })
                        setQueryParams({h: e[0]})
                      }}
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
                    <RadioGroup id="keys_button" defaultValue={keys().toString() || "7"} onChange={(e) => {
                      setKeys(parseInt(e))
                      setData({...data(), keys: parseInt(e)})
                      updatePattern(viewParams().o.toString(), true)
                      updatePatternP2(viewParams().o2.toString())
                      setQueryParams({k: e})
                    }}>
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
                  {keys() !== 9 ? (
                    <div class="space-y-3 pt-3">
                      <Label for="playside_button">{(keys() === 10 || keys() === 14) ? "Flip" : "Side"}</Label>
                      <RadioGroup id="playside_button" defaultValue={viewParams().p.toString()} onChange={(e) => {
                        setViewParams({ ...viewParams(), p: parseInt(e) })
                        setQueryParams({p: e})
                      }}>
                        <Grid cols={2} class="w-full gap-2">
                          <For each={((keys() === 10 || keys() === 14) ? ["OFF", "ON"] : ["P1", "P2"])}>
                            {(side, i) => (
                              <Col>
                                <RadioGroupItem value={(i() + 1).toString()}>
                                  <RadioGroupItemLabel>{side}</RadioGroupItemLabel>
                                </RadioGroupItem>
                              </Col>
                            )}
                          </For>
                        </Grid>
                      </RadioGroup>
                    </div>) : <></>}
                  <div class="space-y-3 pt-3">
                    <Label for="option_button">{keys() >= 10 ? "Option 1P" : "Option"}</Label>
                    <RadioGroup id="option_button" value={viewParams().o >= 2 ? "2" : viewParams().o.toString()} onChange={(e) => {
                      setViewParams({ ...viewParams(), o: parseInt(e) })
                      updatePattern(e)
                    }}>
                      <For each={["OFF", "MIRROR", "RANDOM"]}>
                        {(opt, i) => (
                          <Col>
                            <RadioGroupItem value={(i()).toString()}>
                              <RadioGroupItemLabel>{opt}</RadioGroupItemLabel>
                            </RadioGroupItem>
                          </Col>
                        )}
                      </For>
                    </RadioGroup>
                    <div id="random_pattern">
                      <Input type="text" id="random_pattern_input" value={randomP1()} class="w-30 inline" onChange={(e) => {
                        setRandomP1(e.target.value)
                        setViewParams({ ...viewParams(), o: 2 })
                        updatePattern("2")
                      }} />
                      <button type="submit" id="random_pattern_auto_button" class="inline px-2" onClick={() => {
                        setRandomP1(randomizeKeyPatternStr(keypatInit[keys()], keys() >= 10 ? keys() / 2 : keys()))
                        setViewParams({ ...viewParams(), o: 2 })
                        updatePattern("2")
                      }}><FaSolidArrowRotateRight /></button>
                    </div>
                  </div>
                  {keys() >= 10 ? (
                    <div class="space-y-3 pt-3">
                      <Label for="option_button_2p">Option 2P</Label>
                      <RadioGroup id="option_button_2p" value={viewParams().o2 >= 2 ? "2" : viewParams().o2.toString()} onChange={(e) => {
                        setViewParams({ ...viewParams(), o2: parseInt(e) })
                        updatePatternP2(e)
                      }}>
                        <For each={["OFF", "MIRROR", "RANDOM"]}>
                          {(opt, i) => (
                            <Col>
                              <RadioGroupItem value={(i()).toString()}>
                                <RadioGroupItemLabel>{opt}</RadioGroupItemLabel>
                              </RadioGroupItem>
                            </Col>
                          )}
                        </For>
                      </RadioGroup>
                      <div id="random_pattern_2p">
                        <Input type="text" id="random_pattern_input_2p" value={randomP2()} class="w-30 inline" onChange={(e) => {
                          setRandomP2(e.target.value)
                          setViewParams({ ...viewParams(), o2: 2 })
                          updatePatternP2("2")
                        }} />
                        <button type="submit" id="random_pattern_auto_button_2p" class="inline px-2" onClick={() => {
                          setRandomP2(randomizeKeyPatternStr(keypatInit[keys()], keys() >= 10 ? keys() / 2 : keys()))
                          setViewParams({ ...viewParams(), o2: 2 })
                          updatePatternP2("2")
                        }}><FaSolidArrowRotateRight /></button>
                      </div>
                    </div>) : <></>}
                  <div class="menu_box pt-3">
                    <Slider
                      minValue={0}
                      maxValue={data().score.length - 1 || 0}
                      defaultValue={[viewParams().f, viewParams().t]}
                      onChangeEnd={(e) => {
                        setViewParams({ ...viewParams(), f: e[0], t: e[1] })
                        setQueryParams({f: e[0], t: e[1]})
                      }}
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
                    <RadioGroup id="color_button" defaultValue={viewParams().c.charAt(0).toUpperCase() + viewParams().c.slice(1)} onChange={(e) => {
                      setViewParams({ ...viewParams(), c: e.toLowerCase() })
                      setQueryParams({c: (e === "Default" ? "" : e.toLowerCase())})
                    }}>
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
                        このアプリケーションは<a href="https://github.com/rib2bit">@rib2bit</a>様の<a href="http://ribbit.xyz/bms/score/">BMS Score Viewer</a>の非公認ミラーサイトです。
                      </p>
                      <p>静的サイトとしての公開に伴うソースコードの改変部分について一切の著作者人格権を行使しません。</p><br />
                    </div>
                  </div>
                </div>
                <SheetFooter class="text-xs text-muted-foreground mt-3">
                  <div class="text-center mt-1"><a href="https://github.com/SayakaIsBaka/bms-score-viewer"><img class="inline" src={GitHubLogo} style={{ height: '1rem', width: '1rem' }}/> SayakaIsBaka/bms-score-viewer</a></div>
                  <div class="text-center italic">Based on <a href="https://github.com/ladymade-star/bms-score-viewer">ladymade-star's mirror</a></div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <BmsCanvas data={data()} params={viewParams()} />
      </div>
    </MetaProvider>
  );
}

export default View;
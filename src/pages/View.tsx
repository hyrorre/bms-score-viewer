import type { Component } from 'solid-js';
import { Meta, MetaProvider, Title, Link } from '@solidjs/meta';
import '../../public/js/bms-js.bundle.js'
import 'https://unpkg.com/encoding-japanese@2.1.0/encoding.min.js'
import '../../public/js/jquery-3.7.1.min.js'
import '../../public/plugin/mmenu/jquery.mmenu.all.min.js'
import '../../public/plugin/ion.rangeSlider/js/ion.rangeSlider.min.js'
import '../../public/plugin/ion.checkRadio/js/ion.checkRadio.min.js'
import '../../public/plugin/ion.checkRadio/js/ion.checkRadio.min.js'
import '../../public/plugin/holdon/HoldOn.min.js'
import '../../public/js/main.js'

const View: Component = () => (
  <MetaProvider>
    <Meta charset="utf-8" />
    <Meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <Meta name="viewport" content="width=device-width,user-scalable=no" />
    <Meta name="robots" content="noindex" />
    <Title>BMS Score Viewer -</Title>
    <Link href={"../css/html5reset-1.6.1.css"} rel="stylesheet" />
    <Link href={"../plugin/mmenu/jquery.mmenu.all.css"} rel="stylesheet" />
    <Link href={"../plugin/ion.rangeSlider/css/ion.rangeSlider.css"} rel="stylesheet" />
    <Link href={"../plugin/ion.rangeSlider/css/ion.rangeSlider.skinNice.css"} rel="stylesheet" />
    <Link href={"../plugin/ion.checkRadio/css/ion.checkRadio.css"} rel="stylesheet" />
    <Link href={"../plugin/ion.checkRadio/css/ion.checkRadio.dark.css"} rel="stylesheet" />
    <Link href={"../plugin/filer/css/jquery.filer.css"} rel="stylesheet" />
    <Link href={"../plugin/filer/css/themes/jquery.filer-dragdropbox-theme.css"} rel="stylesheet" />
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
          <p>
            <a href="#menu"><i class="fa fa-cog fa-lg" /></a>
          </p>
        </div>
      </div>
    </div>
    <nav id="menu">
      <div>
        <div id="menu_header">
          <div id="menu_header_misc">
            <a id="link_to_home" href="./"><i class="fa fa-home fa-lg" /></a>
          </div>
          <div id="menu_header_link">
            <a id="link_to_lr2ir" href="#" target="_blank">LR2IR</a>
          </div>
          <div id="menu_header_close">
            <a href="#" id="menu_button"><i class="fa fa-times-circle fa-lg" /></a>
          </div>
        </div>
        <div class="menu_box">
          <div class="menu_box_header">
            <p>width:</p>
          </div>
          <div class="slider_box">
            <input type="text" id="scaleW-slider" />
          </div>
        </div>
        <div class="menu_box">
          <div class="menu_box_header">
            <p>height:</p>
          </div>
          <div class="slider_box">
            <input type="text" id="scaleH_slider" />
          </div>
        </div>
        <div class="menu_box">
          <div class="menu_box_header">
            <p>keys:</p>
          </div>
          <div id="keys_button">
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="keys_5" class="icr-input" type="radio" name="keys" value="5" /></span>
              <span class="icr-text" id="color_text_default">5</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="keys_7" class="icr-input" type="radio" name="keys" value="7" /></span>
              <span class="icr-text" id="color_text_default">7</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="keys_9" class="icr-input" type="radio" name="keys" value="9" /></span>
              <span class="icr-text" id="color_text_default">9</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="keys_10" class="icr-input" type="radio" name="keys" value="10" /></span>
              <span class="icr-text" id="color_text_default">10</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="keys_14" class="icr-input" type="radio" name="keys" value="14" /></span>
              <span class="icr-text" id="color_text_mono">14</span>
            </label>
          </div>
        </div>
        <div class="menu_box" id="playside_option">
          <div class="menu_box_header">
            <p id="playside_text">side:</p>
          </div>
          <div id="playside_button">
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="playside_1p" class="icr-input" type="radio" name="playside" value="1" /></span>
              <span class="icr-text" id="playside_text_1p">1P</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="playside_2p" class="icr-input" type="radio" name="playside" value="2" /></span>
              <span class="icr-text" id="playside_text_2p">2P</span>
            </label>
          </div>
        </div>
        <div class="menu_box">
          <div class="menu_box_header">
            <p id="option_text">option:</p>
          </div>
          <div id="option_button">
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="option_off" class="icr-input" type="radio" name="option" value="0" /></span>
              <span class="icr-text">OFF</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="option_mirror" class="icr-input" type="radio" name="option" value="1" /></span>
              <span class="icr-text" id="option_mirror_text">MIRROR</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="option_random" class="icr-input" type="radio" name="option" value="2" /></span>
              <span class="icr-text">RANDOM</span>
              <div id="random_pattern">
                <input type="text" id="random_pattern_input" value="1234567" />
                <button type="submit" id="random_pattern_auto_button"><i class="fa fa-refresh fa-lg" /></button>
              </div>
            </label>
          </div>
        </div>
        <div class="menu_box" id="menu_box_option_2p">
          <div class="menu_box_header">
            <p>option 2P:</p>
          </div>
          <div id="option_button_2p">
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="option_off_2p" class="icr-input" type="radio" name="option_2p" value="0" /></span>
              <span class="icr-text">OFF</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="option_mirror_2p" class="icr-input" type="radio" name="option_2p" value="1" /></span>
              <span class="icr-text" id="option_mirror_text">MIRROR</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="option_random_2p" class="icr-input" type="radio" name="option_2p" value="2" /></span>
              <span class="icr-text">RANDOM</span>
              <div id="random_pattern_2p">
                <input type="text" id="random_pattern_input_2p" value="1234567" />
                <button type="submit" id="random_pattern_auto_button_2p"><i class="fa fa-refresh fa-lg" /></button>
              </div>
            </label>
          </div>
        </div>
        <div class="menu_box">
          <div class="menu_box_header">
            <p>clip:</p>
          </div>
          <div class="slider_box">
            <input type="text" id="clip_slider" />
          </div>
        </div>
        <div class="menu_box" id="color_option">
          <div class="menu_box_header">
            <p id="color_text">color:</p>
          </div>
          <div id="color_button">
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="color_default" class="icr-input" type="radio" name="color" value="default" /></span>
              <span class="icr-text" id="color_text_default">default</span>
            </label>
            <label class="icr-label">
              <span class="icr-item type_radio" />
              <span class="icr-hidden"><input id="color_mono" class="icr-input" type="radio" name="color" value="mono" /></span>
              <span class="icr-text" id="color_text_mono">mono</span>
            </label>
          </div>
        </div>
        {/*         <div class="menu_box">
    <div class="menu_box_header">
      <p>open BMS:</p>
    </div>
    <div class="open_file_box">
      <form action="register" method="post" enctype="multipart/form-data">
        <input type="file" name="file" id="filer_input" />
      </form>
    </div>
  </div> */}
        <div class="menu_box">
          <div class="menu_box_header">
            <p>note:</p>
          </div>
          <div class="menu_box_body">
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
    </nav>
  </MetaProvider>
);

export default View;
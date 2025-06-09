import type { Component } from "solid-js";
import { createSignal, createResource, onMount } from "solid-js";
import styles from "./App.module.css";

import Uploader from "../components/Uploader";
import ButtonUrl from "../components/ButtonUrl";
import GitHubLogo from "../assets/github-mark.svg";

const fetchData = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/bms/score/query`);
  let r = await res.json();
  return r;
};

const Search: Component = () => {
  const columnDefs = [
    { field: "title", suppressMovable: true, minWidth: 300 },
    { field: "artist", suppressMovable: true, minWidth: 300 },
    { field: "keys", suppressMovable: true, minWidth: 75, maxWidth: 75 },
    {
      field: "bpm",
      suppressMovable: true,
      headerName: "BPM",
      minWidth: 75,
      maxWidth: 75,
    },
    { field: "notes", suppressMovable: true, minWidth: 75, maxWidth: 75 },
    {
      field: "date",
      suppressMovable: true,
      headerName: "Added date",
      minWidth: 200,
      maxWidth: 250,
      valueFormatter: (e: any) => new Date(e.value).toUTCString(),
    },
    {
      field: "md5",
      suppressMovable: true,
      headerName: "LR2IR",
      minWidth: 75,
      maxWidth: 75,
      cellRenderer: (e: any) => (
        <ButtonUrl
          href={`http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5=${e.value}`}
          text={"LR2IR"}
        />
      ),
    },
  ];

  const [data] = createResource(fetchData);
  const [filter, setFilter] = createSignal("");

  onMount(() => {
    document.title = "BMS Score Viewer"; // Required because updating title dynamically in View doesn't work because of default title
  });

  return (
    <div style={styles.App}>
      <h1 class="text-3xl px-4 pt-4">
        BMS Score Viewer{" "}
        <a
          href="https://github.com/SayakaIsBaka/bms-score-viewer"
          target="_blank"
        >
          <img
            class="inline hover:brightness-200"
            title="View repo on GitHub"
            src={GitHubLogo}
            style={{ height: "16pt", width: "16pt" }}
          />
        </a>
      </h1>
      <Uploader />
      <div class="filter-div px-4 pt-4">
        <input
          class="block rounded-md border-0 py-1.5 pl-4 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          type="text"
          id="filter-text-box"
          placeholder="Search..."
          onInput={(e) => setFilter(e.currentTarget.value || "")}
        />
      </div>
      <div
        class="ag-theme-quartz px-4 py-4"
        style={{ height: "63vh", width: "100%" }}
      >
        {data.loading ? "Loading..." : <div />}
      </div>
    </div>
  );
};

export default Search;

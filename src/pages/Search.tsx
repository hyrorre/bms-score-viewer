import type { Component } from 'solid-js';
import { createSignal, createResource } from 'solid-js';
import AgGridSolid from 'ag-grid-solid';
import styles from './App.module.css';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import Uploader from '../components/Uploader';

const fetchData = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/bms/score/query`);
  let r = await res.json();
  for (var e of r)
    e["date"] = new Date(e["date"]).toUTCString();
  return r;
}

const Search: Component = () => {
  const columnDefs = [
    { field: 'title' },
    { field: 'artist' },
    { field: 'keys', width: 10 },
    { field: 'bpm', headerName: 'BPM', width: 10 },
    { field: 'notes', width: 10 },
    { field: 'date', headerName: 'Added date', width: 100 }
  ];

  const [data] = createResource(fetchData);
  const [filter, setFilter] = createSignal("");

  return (
    <div style={styles.App}>
      <h1 class="text-3xl px-4 pt-4">
        BMS Score Viewer
      </h1>
      <Uploader />
      <div class="filter-div px-4 pt-4">
          <input
            class="block rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            type="text"
            id="filter-text-box"
            placeholder="Search..."
            onInput={(e) => setFilter(e.currentTarget.value || "")}
          />
        </div>
      <div class="ag-theme-quartz px-4 py-4" style={{ height: '65vh', width: '100%' }}>
        {data.loading ? "Loading" : (
          <AgGridSolid
            columnDefs={columnDefs}
            rowData={data()}
            onRowClicked={(e) => window.open("./view?md5=" + e.data.md5, '_blank')!.focus()}
            quickFilterText={filter()}
            pagination={true}
            autoSizeStrategy={{
              type: 'fitGridWidth'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Search;
